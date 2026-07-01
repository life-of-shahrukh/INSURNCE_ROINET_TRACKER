import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { Posp, Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { toCsv, type CsvColumn } from '../../common/utils/csv.util';
import {
  attachDealStatsToPosps,
  enrichPospsWithActivity,
  fetchDealStatsByPospId,
  type PospWithComputedActivity,
} from '../../common/business-rules/posp-activity.prisma';
import type { ExternalApiService } from '../../common/external-api/external-api.service';
import { resolvePospDisplayName } from '../../common/external-api/posp-display.util';

const POSP_SORT_FIELDS: Record<string, keyof Posp> = {
  createdAt: 'createdAt',
  name: 'name',
  code: 'code',
  joined: 'joined',
};

@Injectable()
export class PospRepository {
  private readonly logger = new Logger(PospRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApi: ExternalApiService,
  ) {}

  private resolveOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
  ): Prisma.PospOrderByWithRelationInput {
    const field =
      sortBy && POSP_SORT_FIELDS[sortBy]
        ? POSP_SORT_FIELDS[sortBy]
        : 'createdAt';
    return { [field]: sortOrder };
  }

  private async attachDealStats(
    posps: PospWithComputedActivity[],
  ): Promise<PospWithComputedActivity[]> {
    const statsMap = await fetchDealStatsByPospId(
      this.prisma,
      posps.map((p) => p.id),
    );
    return attachDealStatsToPosps(posps, statsMap);
  }

  private async findPaginatedByDealCount(
    where: Prisma.PospWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<PaginatedResult<PospWithComputedActivity>> {
    const matching = await this.prisma.posp.findMany({
      where,
      select: { id: true },
    });
    const total = matching.length;
    const ids = matching.map((p) => p.id);

    const statsMap = await fetchDealStatsByPospId(this.prisma, ids);

    const sortedIds = [...ids].sort((a, b) => {
      const countA = statsMap.get(a)?.dealCount ?? 0;
      const countB = statsMap.get(b)?.dealCount ?? 0;
      if (countA !== countB) {
        return sortOrder === 'desc' ? countB - countA : countA - countB;
      }
      return a.localeCompare(b);
    });

    const pageIds = sortedIds.slice(skip, skip + take);
    if (pageIds.length === 0) {
      return buildPaginatedResult([], total, page, pageSize);
    }

    const rows = await this.prisma.posp.findMany({
      where: { id: { in: pageIds } },
    });
    const rowMap = new Map(rows.map((r) => [r.id, r]));
    const orderedRows = pageIds
      .map((id) => rowMap.get(id))
      .filter((r): r is Posp => r !== undefined);

    const enriched = await enrichPospsWithActivity(this.prisma, orderedRows);
    const data = attachDealStatsToPosps(enriched, statsMap);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  async findPaginated(
    where: Prisma.PospWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<PospWithComputedActivity>> {
    if (sortBy === 'dealCount') {
      return this.findPaginatedByDealCount(
        where,
        skip,
        take,
        page,
        pageSize,
        sortOrder ?? 'desc',
      );
    }

    const orderBy = this.resolveOrderBy(sortBy, sortOrder);
    let [rows, total] = await Promise.all([
      this.prisma.posp.findMany({ where, skip, take, orderBy }),
      this.prisma.posp.count({ where }),
    ]);

    // ── Lazy upsert: if a single exact code/externalId filter returns nothing,
    //    try to fetch from Cognitensor and auto-add to DB, then re-query.
    if (total === 0) {
      const codeFilter =
        (where as Prisma.PospWhereInput & { code?: { equals?: string } })
          ?.code?.equals ??
        (where as Prisma.PospWhereInput & { externalId?: { equals?: string } })
          ?.externalId?.equals;

      if (codeFilter) {
        this.logger.log(
          `[LazyUpsert] POSP code "${codeFilter}" not in DB — attempting live fetch from Cognitensor.`,
        );
        const upserted = await this.upsertFromExternal(codeFilter);
        if (upserted) {
          rows = await this.prisma.posp.findMany({ where, skip, take, orderBy });
          total = rows.length;
        }
      }
    }

    const enriched = await enrichPospsWithActivity(this.prisma, rows);
    const data = await this.attachDealStats(enriched);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  findAll(): Promise<Posp[]> {
    return this.prisma.posp.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findByScope(where: Record<string, unknown>): Promise<Posp[]> {
    return this.prisma.posp.findMany({
      where: where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<PospWithComputedActivity> {
    const posp = await this.prisma.posp.findUnique({ where: { id } });
    if (!posp) throw new NotFoundException(`POSP with id "${id}" not found`);
    const [enriched] = await enrichPospsWithActivity(this.prisma, [posp]);
    return enriched;
  }

  async findByCode(code: string): Promise<Posp | null> {
    return this.prisma.posp.findUnique({ where: { code } });
  }

  async findByEmail(email: string): Promise<Posp | null> {
    return this.prisma.posp.findUnique({ where: { email } });
  }

  /**
   * Fetches a single POSP from Cognitensor live API and upserts into the DB.
   * Returns the upserted DB record, or null if the POSP is not found upstream.
   */
  async upsertFromExternal(code: string): Promise<Posp | null> {
    try {
      const ext = await this.externalApi.getPospByUserCode(code);
      const email = ext.EmailId?.toLowerCase() || `${code.toLowerCase()}@roinet.in`;
      const posp = await this.prisma.posp.upsert({
        where: { code },
        create: {
          code,
          externalId: ext.UserId,
          name: resolvePospDisplayName(ext),
          mobile: ext.MobileNo,
          email,
          gcdCode: ext.HephGcdCode ?? null,
          stateId: ext.stateid ?? null,
          districtId: ext.districtid ?? null,
          cityId: ext.cityid ?? null,
          joined: new Date(),
          active: true,
        },
        update: {
          externalId: ext.UserId,
          name: resolvePospDisplayName(ext),
          mobile: ext.MobileNo,
          email,
          gcdCode: ext.HephGcdCode ?? null,
          stateId: ext.stateid ?? null,
          districtId: ext.districtid ?? null,
          cityId: ext.cityid ?? null,
        },
      });
      this.logger.log(
        `[LazyUpsert] POSP "${code}" upserted from Cognitensor (id: ${posp.id})`,
      );
      return posp;
    } catch {
      // NotFoundException or network error — POSP genuinely doesn't exist upstream
      return null;
    }
  }

  create(dto: CreatePospDto): Promise<Posp> {
    return this.prisma.posp.create({
      data: {
        name: dto.name,
        code: dto.code,
        mobile: dto.mobile,
        email: dto.email,
        joined: new Date(dto.joined),
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePospDto): Promise<Posp> {
    await this.findById(id);
    return this.prisma.posp.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.joined !== undefined && { joined: new Date(dto.joined) }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }

  async exportCsvWhere(where: Prisma.PospWhereInput): Promise<string> {
    const rows = await this.prisma.posp.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    const posps = await enrichPospsWithActivity(this.prisma, rows);
    const columns: CsvColumn<PospWithComputedActivity>[] = [
      { header: 'ID', value: (r) => r.id },
      { header: 'Name', value: (r) => r.name },
      { header: 'Code', value: (r) => r.code },
      { header: 'Mobile', value: (r) => r.mobile },
      { header: 'Email', value: (r) => r.email },
      { header: 'Joined', value: (r) => r.joined.toISOString().split('T')[0] },
      { header: 'Active', value: (r) => (r.active ? 'Yes' : 'No') },
      { header: 'Region', value: (r) => r.region ?? '' },
      { header: 'Zone ID', value: (r) => r.zoneId ?? '' },
      { header: 'Region ID', value: (r) => r.regionId ?? '' },
      { header: 'Area ID', value: (r) => r.areaId ?? '' },
      { header: 'District ID', value: (r) => r.districtId ?? '' },
      {
        header: 'Created At',
        value: (r) => r.createdAt.toISOString().split('T')[0],
      },
    ];
    return toCsv(posps, columns);
  }
}
