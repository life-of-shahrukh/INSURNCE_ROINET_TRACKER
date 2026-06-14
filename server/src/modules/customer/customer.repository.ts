import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Customer, Prisma } from '@prisma/client';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';

const CUSTOMER_SORT_FIELDS: Record<string, keyof Customer> = {
  createdAt: 'createdAt',
  name: 'name',
  kycStatus: 'kycStatus',
};

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  private resolveOrderBy(
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Prisma.CustomerOrderByWithRelationInput {
    const field =
      sortBy && CUSTOMER_SORT_FIELDS[sortBy]
        ? CUSTOMER_SORT_FIELDS[sortBy]
        : 'createdAt';
    return { [field]: sortOrder };
  }

  async findPaginated(
    where: Prisma.CustomerWhereInput,
    skip: number,
    take: number,
    page: number,
    pageSize: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedResult<Customer>> {
    const orderBy = this.resolveOrderBy(sortBy, sortOrder);
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({ where, skip, take, orderBy }),
      this.prisma.customer.count({ where }),
    ]);
    return buildPaginatedResult(data, total, page, pageSize);
  }

  async create(data: Prisma.CustomerCreateInput): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        deals: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        leads: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByMobile(mobile: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({
      where: { mobile },
    });
  }

  async search(query: string): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { mobile: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  async update(
    id: string,
    data: Prisma.CustomerUpdateInput,
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Customer> {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
