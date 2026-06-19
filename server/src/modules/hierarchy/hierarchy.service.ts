import { Injectable } from '@nestjs/common';
import type { OrgMember, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  scopeDistrictIds,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import {
  OrgRole,
  appRoleFromOrgRole,
  orgRoleLabel,
  orgRoleRank,
} from '../../common/external-api/user-type.util';
import {
  loadDistrictOwnersByDistrictId,
  loadPospsForOrgChart,
} from '../../common/org-graph/org-chart-posp.util';

export interface FilterOptionItem {
  id: string;
  name: string;
  designation?: string;
}

/** Managers in scope grouped by their real org role (senior-first). */
export interface RoleGroup {
  /** Org role code (ADMIN | SZH | ZH | CH | RH | ASSISTASM | ASM | CSP | ...) */
  role: string;
  /** Human-readable label ('Super Zonal Head', 'Cluster Head', ...) */
  label: string;
  members: FilterOptionItem[];
}

export interface HierarchyFilterOptions {
  /** Caller's own role */
  callerRole: string;
  /** Role label directly below the caller ('POSP' if caller is a leaf manager) */
  nextLevel: string | null;
  /** Particular people at `nextLevel` within the caller's scope */
  subordinates: FilterOptionItem[];
  /** Managers in scope grouped by real org role, ordered senior-first. */
  roleGroups: RoleGroup[];
}

export interface SubordinatesResult {
  /** Role label of the returned `members` ('POSP' returns `posps` instead) */
  nextLevel: string | null;
  members: FilterOptionItem[];
  posps: FilterOptionItem[];
}

/** A node in the rendered org chart. `id`/`parentId` are external UserCodes. */
export interface OrgChartNode {
  id: string;
  parentId: string | null;
  userId: string;
  name: string;
  /** Org-graph role label (ADMIN | ZH | RH | ...). */
  role: string;
  /** Best-effort app-role bucket (NATIONAL_HEAD | ZH | RH | ASM | DM). */
  appRole: string;
}

/** Kept for the controller's `level` query param (now advisory only). */
export type LevelRole = string;

@Injectable()
export class HierarchyService {
  constructor(private readonly prisma: PrismaService) {}

  // ── org-graph helpers ─────────────────────────────────────────────────────

  /** Resolves the caller's OrgMember id via their SalesTeam employeeCode. */
  private async callerMemberId(user: AuthUser): Promise<string | null> {
    const team = await this.prisma.salesTeam.findUnique({
      where: { userId: user.userId },
      select: { employeeCode: true },
    });
    if (!team) return null;
    const member = await this.prisma.orgMember.findFirst({
      where: { userCode: team.employeeCode },
      select: { id: true },
    });
    return member?.id ?? null;
  }

  /** Direct reports of a manager (one step down the graph). */
  private async directReports(managerId: string): Promise<OrgMember[]> {
    const edges = await this.prisma.orgEdge.findMany({
      where: { managerId },
      select: { memberId: true },
    });
    const ids = edges.map((e) => e.memberId);
    if (ids.length === 0) return [];
    return this.prisma.orgMember.findMany({ where: { id: { in: ids } } });
  }

  /** Members with no manager edge — the roots of the graph (for admins). */
  private async rootMembers(): Promise<OrgMember[]> {
    const [members, edges] = await Promise.all([
      this.prisma.orgMember.findMany(),
      this.prisma.orgEdge.findMany({ select: { memberId: true } }),
    ]);
    const children = new Set(edges.map((e) => e.memberId));
    return members.filter((m) => !children.has(m.id));
  }

  /** Distinct DistrictChain rows inside the caller's scope. */
  private scopedDistrictChains(
    scope: HierarchyScope,
  ): Promise<Array<{ districtId: string; memberId: string }>> {
    const ids = scopeDistrictIds(scope);
    return this.prisma.districtChain.findMany({
      where: ids === null ? undefined : { districtId: { in: ids } },
      select: { districtId: true, memberId: true },
    });
  }

  private toItem(member: OrgMember): FilterOptionItem {
    const appRole = appRoleFromOrgRole(member.role as OrgRole);
    return {
      id: member.userCode,
      name: member.userName ?? member.userCode,
      designation: appRole,
    };
  }

  /** App-role label of the most senior member, for the cascade dropdown. */
  private representativeLevel(members: OrgMember[]): string | null {
    if (members.length === 0) return null;
    const senior = members.reduce((a, b) =>
      orgRoleRank(b.role as OrgRole) > orgRoleRank(a.role as OrgRole) ? b : a,
    );
    return appRoleFromOrgRole(senior.role as OrgRole);
  }

  // ── public API ─────────────────────────────────────────────────────────

  async getFilterOptions(
    user: AuthUser,
    scope: HierarchyScope,
  ): Promise<HierarchyFilterOptions> {
    const chains = await this.scopedDistrictChains(scope);

    // Geo dimensions are now served by the cached Geo Catalog (GET /geo/catalog
    // + server-side search), so this endpoint only returns people dimensions.
    const districtIds = [...new Set(chains.map((c) => c.districtId))];

    // Manager-level dimensions: distinct members covering scope, grouped by
    // their real org role (senior-first), so higher roles like Cluster Head /
    // Zonal Head / Super Zonal Head surface as their own filter dropdowns.
    const memberIds = [...new Set(chains.map((c) => c.memberId))];
    const members =
      memberIds.length > 0
        ? await this.prisma.orgMember.findMany({
            where: { id: { in: memberIds } },
          })
        : [];
    const roleGroups = this.groupMembersByRole(members);

    // Cascade: the people directly below the caller in the org graph.
    let nextLevel: string | null = null;
    let subordinates: FilterOptionItem[] = [];
    if (user.role !== Role.POSP) {
      const callerId = await this.callerMemberId(user);
      const reports = callerId
        ? await this.directReports(callerId)
        : await this.rootMembers();

      if (reports.length > 0) {
        nextLevel = this.representativeLevel(reports);
        subordinates = sortItems(reports.map((m) => this.toItem(m)));
      } else {
        // Leaf manager (or unmatched) → terminal POSP level.
        nextLevel = Role.POSP;
        subordinates = await this.pospsInDistricts(districtIds);
      }
    }

    return {
      callerRole: user.role,
      nextLevel,
      subordinates,
      roleGroups,
    };
  }

  /**
   * Server-side typeahead over members within the caller's scope, matched by
   * name or user code. Used by filter autocompletes so the client never pulls
   * the full member list.
   */
  async searchMembers(
    q: string,
    scope: HierarchyScope,
    limit = 20,
    role?: string,
  ): Promise<FilterOptionItem[]> {
    const term = q.trim();
    const scopeIds = scopeDistrictIds(scope);

    let memberIds: string[] | null = null;
    if (scopeIds !== null) {
      if (scopeIds.length === 0) return [];
      const chains = await this.prisma.districtChain.findMany({
        where: { districtId: { in: scopeIds } },
        select: { memberId: true },
        distinct: ['memberId'],
      });
      memberIds = chains.map((c) => c.memberId);
      if (memberIds.length === 0) return [];
    }

    const where: Prisma.OrgMemberWhereInput = {};
    if (memberIds !== null) where.id = { in: memberIds };
    if (role) where.role = role;
    if (term) {
      where.OR = [
        { userName: { contains: term } },
        { userCode: { contains: term } },
      ];
    }

    const members = await this.prisma.orgMember.findMany({
      where,
      take: limit,
      orderBy: { userName: 'asc' },
    });
    return sortItems(members.map((m) => this.toItem(m)));
  }

  /**
   * Groups members by their real org role, sorted members by name, with groups
   * ordered senior-first (by org-role rank). Roles with no members are omitted.
   */
  private groupMembersByRole(members: OrgMember[]): RoleGroup[] {
    const byRole = new Map<string, FilterOptionItem[]>();
    for (const m of members) {
      const role = m.role;
      if (!byRole.has(role)) byRole.set(role, []);
      byRole.get(role)!.push(this.toItem(m));
    }
    return [...byRole.entries()]
      .map(([role, items]) => ({
        role,
        label: orgRoleLabel(role),
        members: sortItems(dedupeItems(items)),
      }))
      .sort(
        (a, b) =>
          orgRoleRank(b.role as OrgRole) - orgRoleRank(a.role as OrgRole),
      );
  }

  /**
   * Drill into a specific person (identified by `code`) and return the next
   * level down, always intersected with the caller's scope so a manager can
   * never see siblings or anyone outside their territory. `level` is advisory.
   */
  async getSubordinatesByCode(
    _level: LevelRole,
    code: string,
    scope: HierarchyScope,
  ): Promise<SubordinatesResult> {
    const member = await this.prisma.orgMember.findFirst({
      where: { userCode: code },
      select: { id: true },
    });
    if (!member) return { nextLevel: null, members: [], posps: [] };

    // Districts the selected person covers, intersected with caller scope.
    const ownChains = await this.prisma.districtChain.findMany({
      where: { memberId: member.id },
      select: { districtId: true },
      distinct: ['districtId'],
    });
    let districtIds = ownChains.map((c) => c.districtId);
    const scopeIds = scopeDistrictIds(scope);
    if (scopeIds !== null) {
      const allowed = new Set(scopeIds);
      districtIds = districtIds.filter((id) => allowed.has(id));
    }
    if (districtIds.length === 0) {
      return { nextLevel: null, members: [], posps: [] };
    }

    const reports = await this.directReports(member.id);
    if (reports.length > 0) {
      // Keep only reports whose territory overlaps the allowed districts.
      const allowed = new Set(districtIds);
      const filtered = await this.filterMembersByDistricts(reports, allowed);
      const visible = filtered.length > 0 ? filtered : reports;
      return {
        nextLevel: this.representativeLevel(visible),
        members: sortItems(visible.map((m) => this.toItem(m))),
        posps: [],
      };
    }

    // Selected node is a leaf manager → return its POSPs.
    return {
      nextLevel: Role.POSP,
      members: [],
      posps: await this.pospsInDistricts(districtIds),
    };
  }

  /**
   * Org chart for the caller's territory. Builds nodes from OrgMember +
   * OrgEdge restricted to members that cover the scoped districts (all members
   * for an unrestricted caller). Parent links are kept inside the node set so
   * the chart renders as a self-contained tree.
   */
  async getOrgChart(scope: HierarchyScope): Promise<OrgChartNode[]> {
    const scopeIds = scopeDistrictIds(scope);

    let members: OrgMember[];
    if (scopeIds === null) {
      members = await this.prisma.orgMember.findMany();
    } else {
      const chains = await this.prisma.districtChain.findMany({
        where: { districtId: { in: scopeIds } },
        select: { memberId: true },
        distinct: ['memberId'],
      });
      const ids = chains.map((c) => c.memberId);
      members =
        ids.length > 0
          ? await this.prisma.orgMember.findMany({ where: { id: { in: ids } } })
          : [];
    }
    if (members.length === 0) return [];

    const inScope = new Set(members.map((m) => m.id));
    const codeById = new Map(members.map((m) => [m.id, m.userCode]));

    const edges = await this.prisma.orgEdge.findMany({
      where: { memberId: { in: [...inScope] } },
      select: { memberId: true, managerId: true },
    });
    // First in-scope manager wins as the rendered parent.
    const parentOf = new Map<string, string>();
    for (const e of edges) {
      if (!inScope.has(e.managerId)) continue;
      if (!parentOf.has(e.memberId)) parentOf.set(e.memberId, e.managerId);
    }

    const managerNodes = members.map((m) => {
      const parentId = parentOf.get(m.id);
      return {
        id: m.userCode,
        parentId: parentId ? (codeById.get(parentId) ?? null) : null,
        userId: m.userId,
        name: m.userName ?? m.userCode,
        role: m.role,
        appRole: appRoleFromOrgRole(m.role as OrgRole),
      };
    });

    const pospNodes = await this.buildPospChartNodes(
      scopeIds,
      new Set(managerNodes.map((n) => n.id)),
    );
    return [...managerNodes, ...pospNodes];
  }

  /**
   * POSPs attach to the district owner (chainLevel 0) for their `districtId`.
   * Node ids use UserCode so the chart stays consistent with manager nodes.
   */
  private async buildPospChartNodes(
    scopeDistrictIds: string[] | null,
    managerCodesInChart: Set<string>,
  ): Promise<OrgChartNode[]> {
    const owners = await loadDistrictOwnersByDistrictId(this.prisma);
    const districtIds = scopeDistrictIds ?? [...owners.keys()];
    const posps = await loadPospsForOrgChart(this.prisma, districtIds);

    const nodes: OrgChartNode[] = [];
    for (const p of posps) {
      const owner = owners.get(p.districtId);
      if (!owner || !managerCodesInChart.has(owner.userCode)) continue;

      nodes.push({
        id: p.code,
        parentId: owner.userCode,
        userId: p.externalId ?? p.id,
        name: p.name || p.code,
        role: Role.POSP,
        appRole: Role.POSP,
      });
    }
    return nodes;
  }

  // ── private helpers ───────────────────────────────────────────────────────

  private async filterMembersByDistricts(
    members: OrgMember[],
    allowed: Set<string>,
  ): Promise<OrgMember[]> {
    if (members.length === 0) return [];
    const chains = await this.prisma.districtChain.findMany({
      where: { memberId: { in: members.map((m) => m.id) } },
      select: { memberId: true, districtId: true },
    });
    const coversAllowed = new Set<string>();
    for (const c of chains) {
      if (allowed.has(c.districtId)) coversAllowed.add(c.memberId);
    }
    return members.filter((m) => coversAllowed.has(m.id));
  }

  private async pospsInDistricts(
    districtIds: string[],
  ): Promise<FilterOptionItem[]> {
    if (districtIds.length === 0) return [];
    const rows = await this.prisma.posp.findMany({
      where: { districtId: { in: districtIds } },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((p) => ({
      id: p.id,
      name: `${p.name} (${p.code})`,
      designation: Role.POSP,
    }));
  }
}

function dedupeItems(items: FilterOptionItem[]): FilterOptionItem[] {
  const seen = new Map<string, FilterOptionItem>();
  for (const it of items) if (!seen.has(it.id)) seen.set(it.id, it);
  return [...seen.values()];
}

function sortItems(items: FilterOptionItem[]): FilterOptionItem[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}
