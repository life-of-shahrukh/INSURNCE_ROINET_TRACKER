import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesTeam, Prisma } from '@prisma/client';

@Injectable()
export class SalesTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SalesTeamCreateInput): Promise<SalesTeam> {
    return this.prisma.salesTeam.create({ data });
  }

  async findAll(): Promise<SalesTeam[]> {
    return this.prisma.salesTeam.findMany({
      include: {
        manager: { select: { id: true, name: true, designation: true } },
        pospsManaged: { select: { id: true, name: true, code: true } },
        _count: { select: { subordinates: true, leadsAssigned: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<SalesTeam | null> {
    return this.prisma.salesTeam.findUnique({
      where: { id },
      include: {
        manager: true,
        subordinates: {
          include: {
            subordinates: true,
            pospsManaged: { select: { id: true, name: true, code: true } },
          },
        },
        pospsManaged: true,
      },
    });
  }

  async findRoots(): Promise<SalesTeam[]> {
    return this.prisma.salesTeam.findMany({
      where: { managerId: null },
      include: {
        subordinates: {
          include: {
            subordinates: {
              include: {
                subordinates: {
                  include: { pospsManaged: { select: { id: true, name: true } } },
                },
                pospsManaged: { select: { id: true, name: true } },
              },
            },
            pospsManaged: { select: { id: true, name: true } },
          },
        },
        pospsManaged: { select: { id: true, name: true } },
      },
    });
  }

  async findByEmployeeCode(code: string): Promise<SalesTeam | null> {
    return this.prisma.salesTeam.findUnique({ where: { employeeCode: code } });
  }

  async update(id: string, data: Prisma.SalesTeamUpdateInput): Promise<SalesTeam> {
    return this.prisma.salesTeam.update({ where: { id }, data });
  }

  async upsertByEmployeeCode(
    employeeCode: string,
    data: Prisma.SalesTeamCreateInput,
  ): Promise<SalesTeam> {
    return this.prisma.salesTeam.upsert({
      where: { employeeCode },
      create: data,
      update: {
        name: data.name,
        designation: data.designation,
        territory: data.territory,
      },
    });
  }
}
