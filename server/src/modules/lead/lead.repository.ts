import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Lead, Prisma } from '@prisma/client';

@Injectable()
export class LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      where: where as Parameters<typeof this.prisma.lead.findMany>[0]['where'],
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
}
