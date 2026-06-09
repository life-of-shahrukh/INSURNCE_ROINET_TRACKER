import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Customer, Prisma } from '@prisma/client';

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
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
