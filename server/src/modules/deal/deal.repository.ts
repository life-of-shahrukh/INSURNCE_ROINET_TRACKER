import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal, Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';

/**
 * Effective COA in rupees. PERCENT mode treats `coa` as a percent of premium;
 * AMOUNT mode uses `coa` directly. Persisted as `coaAmount` so DB aggregations
 * never need to know the entry mode.
 */
function computeCoaAmount(
  coaType: string,
  coa: number,
  premium: number,
): number {
  return coaType === 'PERCENT' ? (premium * coa) / 100 : coa;
}

const DEAL_SORT_FIELDS: Record<string, keyof Deal> = {
  createdAt: 'createdAt',
  expected: 'expected',
  premium: 'premium',
  customerName: 'customerName',
  status: 'status',
};

@Injectable()
export class DealRepository {
  constructor(private readonly prisma: PrismaService) {}

  private resolveOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Prisma.DealOrderByWithRelationInput {
    const field =
      sortBy && DEAL_SORT_FIELDS[sortBy]
        ? DEAL_SORT_FIELDS[sortBy]
        : 'createdAt';
    return { [field]: sortOrder };
  }

  async findPaginated(
    where: Prisma.DealWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<Deal>> {
    const orderBy = this.resolveOrderBy(sortBy, sortOrder);
    const [data, total] = await Promise.all([
      this.prisma.deal.findMany({ where, skip, take, orderBy }),
      this.prisma.deal.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  findAll(): Promise<Deal[]> {
    return this.prisma.deal.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findAllByPospId(pospId: string): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      where: { pospId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findByScope(where: Record<string, unknown>): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      where: where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException(`Deal with id "${id}" not found`);
    return deal;
  }

  async findByIdForPosp(id: string, pospId: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({ where: { id, pospId } });
    if (!deal) {
      throw new NotFoundException(`Deal with id "${id}" not found`);
    }
    return deal;
  }

  create(dto: CreateDealDto): Promise<Deal> {
    const coaType = dto.coaType ?? 'AMOUNT';
    const coa = dto.coa ?? 0;
    return this.prisma.deal
      .create({
        data: {
          pospId: dto.pospId ?? null,
          customerId: dto.customerId ?? null,
          customerName: dto.customer,
          policy: dto.policy,
          sum: dto.sum,
          premium: dto.premium,
          coa,
          coaType,
          coaAmount: computeCoaAmount(coaType, coa, dto.premium),
          margin: dto.margin ?? 0,
          status: dto.status,
          expected: new Date(dto.expected),
          proposal: dto.proposal ?? '',
          policyNo: dto.policyNo ?? '',
          issued: dto.issued ? new Date(dto.issued) : null,
          remarks: dto.remarks ?? '',
        },
      })
      .catch((e: unknown) => this.handlePrismaError(e));
  }

  createForPosp(pospId: string, dto: CreateDealDto): Promise<Deal> {
    const coaType = dto.coaType ?? 'AMOUNT';
    const coa = dto.coa ?? 0;
    return this.prisma.deal
      .create({
        data: {
          pospId,
          customerId: dto.customerId ?? null,
          customerName: dto.customer,
          policy: dto.policy,
          sum: dto.sum,
          premium: dto.premium,
          coa,
          coaType,
          coaAmount: computeCoaAmount(coaType, coa, dto.premium),
          margin: dto.margin ?? 0,
          status: dto.status,
          expected: new Date(dto.expected),
          proposal: dto.proposal ?? '',
          policyNo: dto.policyNo ?? '',
          issued: dto.issued ? new Date(dto.issued) : null,
          remarks: dto.remarks ?? '',
        },
      })
      .catch((e: unknown) => this.handlePrismaError(e));
  }

  async update(id: string, dto: UpdateDealDto): Promise<Deal> {
    const existing = await this.findById(id);
    // Recompute the effective COA whenever its inputs change (raw value, mode,
    // or premium — PERCENT-mode COA depends on premium).
    const recomputeCoa =
      dto.coa !== undefined ||
      dto.coaType !== undefined ||
      dto.premium !== undefined;
    const coaType = dto.coaType ?? existing.coaType;
    const coa = dto.coa ?? existing.coa;
    const premium = dto.premium ?? existing.premium;
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.pospId !== undefined && { pospId: dto.pospId }),
        ...(dto.customer !== undefined && { customerName: dto.customer }),
        ...(dto.policy !== undefined && { policy: dto.policy }),
        ...(dto.sum !== undefined && { sum: dto.sum }),
        ...(dto.premium !== undefined && { premium: dto.premium }),
        ...(dto.coa !== undefined && { coa: dto.coa }),
        ...(dto.coaType !== undefined && { coaType: dto.coaType }),
        ...(recomputeCoa && {
          coaAmount: computeCoaAmount(coaType, coa, premium),
        }),
        ...(dto.margin !== undefined && { margin: dto.margin }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expected !== undefined && { expected: new Date(dto.expected) }),
        ...(dto.proposal !== undefined && { proposal: dto.proposal }),
        ...(dto.policyNo !== undefined && { policyNo: dto.policyNo }),
        ...(dto.issued !== undefined && {
          issued: dto.issued ? new Date(dto.issued) : null,
        }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
    });
  }

  async updateByPosp(
    id: string,
    pospId: string,
    dto: UpdateDealDto,
  ): Promise<Deal> {
    const existing = await this.findByIdForPosp(id, pospId);
    // POSP cannot edit COA/margin (stripped in service), but changing premium
    // must still keep a PERCENT-mode coaAmount in sync.
    const recomputeCoa =
      dto.coa !== undefined ||
      dto.coaType !== undefined ||
      dto.premium !== undefined;
    const coaType = dto.coaType ?? existing.coaType;
    const coa = dto.coa ?? existing.coa;
    const premium = dto.premium ?? existing.premium;
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.customer !== undefined && { customerName: dto.customer }),
        ...(dto.policy !== undefined && { policy: dto.policy }),
        ...(dto.sum !== undefined && { sum: dto.sum }),
        ...(dto.premium !== undefined && { premium: dto.premium }),
        ...(dto.coa !== undefined && { coa: dto.coa }),
        ...(dto.coaType !== undefined && { coaType: dto.coaType }),
        ...(recomputeCoa && {
          coaAmount: computeCoaAmount(coaType, coa, premium),
        }),
        ...(dto.margin !== undefined && { margin: dto.margin }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expected !== undefined && { expected: new Date(dto.expected) }),
        ...(dto.proposal !== undefined && { proposal: dto.proposal }),
        ...(dto.policyNo !== undefined && { policyNo: dto.policyNo }),
        ...(dto.issued !== undefined && {
          issued: dto.issued ? new Date(dto.issued) : null,
        }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.deal.delete({ where: { id } });
  }

  async deleteByPosp(id: string, pospId: string): Promise<void> {
    await this.prisma.deal.deleteMany({ where: { id, pospId } });
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Invalid POSP selected — please refresh and try again',
        );
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }
    }
    throw error;
  }

  async exportCsvWhere(where: Prisma.DealWhereInput): Promise<string> {
    const deals = await this.prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return this.formatCsv(deals);
  }

  private formatCsv(deals: Deal[]): string {
    const header =
      'id,pospId,customer,policy,sum,premium,coa,margin,status,expected,proposal,policyNo,issued,remarks';
    const rows = deals.map((d) =>
      [
        d.id,
        d.pospId,
        `"${d.customerName}"`,
        d.policy,
        d.sum,
        d.premium,
        d.coa,
        d.margin,
        d.status,
        d.expected.toISOString().split('T')[0],
        d.proposal,
        d.policyNo,
        d.issued ? d.issued.toISOString().split('T')[0] : '',
        `"${d.remarks}"`,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  async exportCsv(): Promise<string> {
    const deals = await this.findAll();
    return this.formatCsv(deals);
  }

  async exportCsvByPosp(pospId: string): Promise<string> {
    const deals = await this.findAllByPospId(pospId);
    return this.formatCsv(deals);
  }
}
