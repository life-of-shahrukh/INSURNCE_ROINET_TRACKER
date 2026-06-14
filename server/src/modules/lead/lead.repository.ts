import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Lead, Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { toCsv, type CsvColumn } from '../../common/utils/csv.util';

const LEAD_INCLUDE = {
  customer: true,
  assignedTo: true,
} as const;

const LEAD_SORT_FIELDS: Record<string, keyof Lead> = {
  createdAt: 'createdAt',
  expectedCloseDate: 'expectedCloseDate',
  estimatedPremium: 'estimatedPremium',
  status: 'status',
};

@Injectable()
export class LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  private resolveOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Prisma.LeadOrderByWithRelationInput {
    const field =
      sortBy && LEAD_SORT_FIELDS[sortBy]
        ? LEAD_SORT_FIELDS[sortBy]
        : 'createdAt';
    return { [field]: sortOrder };
  }

  async findPaginated(
    where: Prisma.LeadWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<Lead>> {
    const orderBy = this.resolveOrderBy(sortBy, sortOrder);
    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy,
        include: LEAD_INCLUDE,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  async create(data: Prisma.LeadCreateInput): Promise<Lead> {
    return this.prisma.lead.create({ data });
  }

  async findAll(): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByScope(where: Record<string, unknown>): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: where,
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Lead | null> {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: true,
      },
    });
  }

  async findByTimeline(timeline: string): Promise<Lead[]> {
    return this.prisma.lead.findMany({
      where: { closureTimeline: timeline },
      include: {
        customer: true,
        assignedTo: true,
      },
      orderBy: { expectedCloseDate: 'asc' },
    });
  }

  async getMonthlyCommitment(): Promise<{ total: number; count: number }> {
    const result = await this.prisma.lead.aggregate({
      where: {
        closureTimeline: 'THIS_MONTH',
        status: {
          notIn: ['WON', 'LOST'],
        },
      },
      _sum: {
        estimatedPremium: true,
      },
      _count: true,
    });

    return {
      total: result._sum.estimatedPremium || 0,
      count: result._count,
    };
  }

  async update(id: string, data: Prisma.LeadUpdateInput): Promise<Lead> {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: {
        customer: true,
        assignedTo: true,
      },
    });
  }

  async delete(id: string): Promise<Lead> {
    return this.prisma.lead.delete({
      where: { id },
    });
  }

  async exportCsvWhere(where: Prisma.LeadWhereInput): Promise<string> {
    const leads = await this.prisma.lead.findMany({
      where,
      include: { customer: true, assignedTo: true },
      orderBy: { createdAt: 'desc' },
    });
    const columns: CsvColumn<(typeof leads)[0]>[] = [
      { header: 'ID', value: (r) => r.id },
      { header: 'Customer Name', value: (r) => r.customer?.name ?? '' },
      { header: 'Customer Mobile', value: (r) => r.customer?.mobile ?? '' },
      { header: 'Product', value: (r) => r.product },
      { header: 'Estimated Premium', value: (r) => r.estimatedPremium },
      { header: 'Estimated Sum', value: (r) => r.estimatedSum ?? '' },
      { header: 'Status', value: (r) => r.status },
      { header: 'Closure Timeline', value: (r) => r.closureTimeline },
      { header: 'Expected Close Date', value: (r) => r.expectedCloseDate?.toISOString().split('T')[0] ?? '' },
      { header: 'Source', value: (r) => r.source ?? '' },
      { header: 'Assigned To', value: (r) => r.assignedTo?.name ?? '' },
      { header: 'Remarks', value: (r) => r.remarks ?? '' },
      { header: 'Created At', value: (r) => r.createdAt.toISOString().split('T')[0] },
    ];
    return toCsv(leads, columns);
  }
}
