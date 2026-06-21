import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesTeam } from '@prisma/client';

export interface OrgChartNode extends SalesTeam {
  subordinates: OrgChartNode[];
}

@Injectable()
export class OrgChartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<SalesTeam[]> {
    return this.prisma.salesTeam.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<SalesTeam | null> {
    return this.prisma.salesTeam.findUnique({ where: { id } });
  }

  buildTree(allMembers: SalesTeam[]): OrgChartNode[] {
    const map = new Map<string, OrgChartNode>();

    for (const member of allMembers) {
      map.set(member.id, { ...member, subordinates: [] });
    }

    const roots: OrgChartNode[] = [];

    for (const node of map.values()) {
      if (node.managerId && map.has(node.managerId)) {
        const parent = map.get(node.managerId);
        if (parent) {
          parent.subordinates.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
