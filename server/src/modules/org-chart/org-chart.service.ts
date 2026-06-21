import { Injectable, NotFoundException } from '@nestjs/common';
import { OrgChartRepository, OrgChartNode } from './org-chart.repository';

@Injectable()
export class OrgChartService {
  constructor(private readonly orgChartRepo: OrgChartRepository) {}

  async getTree(): Promise<OrgChartNode[]> {
    const allMembers = await this.orgChartRepo.findAll();
    return this.orgChartRepo.buildTree(allMembers);
  }

  async getSubtree(rootId: string): Promise<OrgChartNode> {
    const root = await this.orgChartRepo.findById(rootId);
    if (!root) {
      throw new NotFoundException(
        `Sales team member with id "${rootId}" not found`,
      );
    }
    const allMembers = await this.orgChartRepo.findAll();
    const tree = this.orgChartRepo.buildTree(allMembers);
    const found = this.findNodeById(tree, rootId);
    if (!found) {
      throw new NotFoundException(
        `Sales team member with id "${rootId}" not found in tree`,
      );
    }
    return found;
  }

  private findNodeById(nodes: OrgChartNode[], id: string): OrgChartNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = this.findNodeById(node.subordinates, id);
      if (found) return found;
    }
    return null;
  }
}
