import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { Posp, Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { toCsv, type CsvColumn } from '../../common/utils/csv.util';

const POSP_SORT_FIELDS: Record<string, keyof Posp> = {
  createdAt: 'createdAt',
  name: 'name',
  code: 'code',
  joined: 'joined',
};

@Injectable()
export class PospRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findPaginated(
    where: Prisma.PospWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<Posp>> {
    const orderBy = this.resolveOrderBy(sortBy, sortOrder);
    const [data, total] = await Promise.all([
      this.prisma.posp.findMany({ where, skip, take, orderBy }),
      this.prisma.posp.count({ where }),
    ]);
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

  async findById(id: string): Promise<Posp> {
    const posp = await this.prisma.posp.findUnique({ where: { id } });
    if (!posp) throw new NotFoundException(`POSP with id "${id}" not found`);
    return posp;
  }

  async findByEmail(email: string): Promise<Posp | null> {
    return this.prisma.posp.findUnique({ where: { email } });
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
    const posps = await this.prisma.posp.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    const columns: CsvColumn<Posp>[] = [
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
