import type { OrgMember } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { resolveOrgMemberCode } from '../auth/hierarchy-scope.util';
import type { AuthUser } from '../auth/auth-user.interface';
import { Role } from '../constants';
import {
  OrgRole,
  orgRoleLabel,
  orgRoleRank,
} from '../external-api/user-type.util';
import { loadDistrictOwnersByDistrictId } from './org-chart-posp.util';

export interface TeamPersonReportsTo {
  id: string;
  name: string;
  role: string;
  label: string;
}

export interface TeamPerson {
  id: string;
  name: string;
  role: string;
  label: string;
  /** CSP / user code — set for POSP rows. */
  code?: string;
  stateName?: string | null;
  districtName?: string | null;
  cityName?: string | null;
  reportsTo?: TeamPersonReportsTo | null;
}

/** Resolves Cognitensor geo ids to display names for profile team summaries. */
export interface GeoNameResolver {
  districtById(
    id: string,
  ): { name: string; stateName: string | null } | undefined;
  cityById(id: string): { name: string } | undefined;
  stateById(id: string): { name: string } | undefined;
}

export interface RoleTeamBucket {
  role: string;
  label: string;
  directCount: number;
  totalCount: number;
  members: TeamPerson[];
}

export interface DownlineTeamSummary {
  mode: 'downline';
  districtCount: number;
  pospCount: number;
  managerCount: number;
  roles: RoleTeamBucket[];
}

export interface UplineTeamSummary {
  mode: 'upline';
  districtName: string | null;
  reportingChain: TeamPerson[];
}

export type ProfileTeamSummary = DownlineTeamSummary | UplineTeamSummary;

const POSP_ROLE = 'POSP';

function memberToPerson(m: OrgMember): TeamPerson {
  return {
    id: m.userCode,
    code: m.userCode,
    name: m.userName ?? m.userCode,
    role: m.role,
    label: orgRoleLabel(m.role),
  };
}

/** Batch-enrich org members with territory summary and direct manager. */
async function enrichMembersToPeople(
  prisma: PrismaService,
  members: OrgMember[],
  geo: GeoNameResolver,
): Promise<TeamPerson[]> {
  if (members.length === 0) return [];

  const memberIds = members.map((m) => m.id);
  const [chains, edges] = await Promise.all([
    prisma.districtChain.findMany({
      where: { memberId: { in: memberIds } },
      select: {
        memberId: true,
        districtId: true,
        districtName: true,
        stateId: true,
      },
    }),
    prisma.orgEdge.findMany({
      where: { memberId: { in: memberIds } },
      select: { memberId: true, managerId: true },
    }),
  ]);

  const managerIds = [...new Set(edges.map((e) => e.managerId))];
  const managerRows =
    managerIds.length > 0
      ? await prisma.orgMember.findMany({ where: { id: { in: managerIds } } })
      : [];
  const managerById = new Map(managerRows.map((m) => [m.id, m]));
  const managerIdByMemberId = new Map(
    edges.map((e) => [e.memberId, e.managerId]),
  );

  const chainsByMember = new Map<string, typeof chains>();
  for (const c of chains) {
    const list = chainsByMember.get(c.memberId) ?? [];
    list.push(c);
    chainsByMember.set(c.memberId, list);
  }

  return members.map((m) => {
    const memberChains = chainsByMember.get(m.id) ?? [];
    const districtIds = [...new Set(memberChains.map((c) => c.districtId))];

    const stateNames = new Set<string>();
    const districtLabels: string[] = [];
    for (const did of districtIds) {
      const geoDistrict = geo.districtById(did);
      if (geoDistrict) {
        districtLabels.push(geoDistrict.name);
        if (geoDistrict.stateName) stateNames.add(geoDistrict.stateName);
      } else {
        const chainRow = memberChains.find((c) => c.districtId === did);
        if (chainRow?.districtName) districtLabels.push(chainRow.districtName);
        if (chainRow?.stateId) {
          const state = geo.stateById(chainRow.stateId);
          if (state) stateNames.add(state.name);
        }
      }
    }

    let stateName: string | null = null;
    let districtName: string | null = null;
    if (stateNames.size === 1) {
      stateName = [...stateNames][0] ?? null;
    } else if (stateNames.size > 1) {
      stateName = `${stateNames.size} states`;
    }
    if (districtIds.length === 1) {
      districtName = districtLabels[0] ?? null;
    } else if (districtIds.length > 1) {
      districtName = `${districtIds.length} districts`;
    }

    let reportsTo: TeamPersonReportsTo | null = null;
    const mgrId = managerIdByMemberId.get(m.id);
    if (mgrId) {
      const mgr = managerById.get(mgrId);
      if (mgr && mgr.role !== OrgRole.ADMIN) {
        reportsTo = {
          id: mgr.userCode,
          name: mgr.userName ?? mgr.userCode,
          role: mgr.role,
          label: orgRoleLabel(mgr.role),
        };
      }
    }

    return {
      id: m.userCode,
      code: m.userCode,
      name: m.userName ?? m.userCode,
      role: m.role,
      label: orgRoleLabel(m.role),
      stateName,
      districtName,
      cityName: null,
      reportsTo,
    };
  });
}

async function filterMembersByDistricts(
  prisma: PrismaService,
  members: OrgMember[],
  allowed: Set<string>,
): Promise<OrgMember[]> {
  if (members.length === 0) return [];
  const chains = await prisma.districtChain.findMany({
    where: { memberId: { in: members.map((m) => m.id) } },
    select: { memberId: true, districtId: true },
  });
  const coversAllowed = new Set<string>();
  for (const c of chains) {
    if (allowed.has(c.districtId)) coversAllowed.add(c.memberId);
  }
  return members.filter((m) => coversAllowed.has(m.id));
}

async function districtIdsForMember(
  prisma: PrismaService,
  memberId: string,
): Promise<string[]> {
  const rows = await prisma.districtChain.findMany({
    where: { memberId },
    select: { districtId: true },
    distinct: ['districtId'],
  });
  return rows.map((r) => r.districtId);
}

async function directReports(
  prisma: PrismaService,
  managerId: string,
): Promise<OrgMember[]> {
  const edges = await prisma.orgEdge.findMany({
    where: { managerId },
    select: { memberId: true },
  });
  const ids = edges.map((e) => e.memberId);
  if (ids.length === 0) return [];
  return prisma.orgMember.findMany({ where: { id: { in: ids } } });
}

function groupByRole(members: OrgMember[]): Map<string, OrgMember[]> {
  const map = new Map<string, OrgMember[]>();
  for (const m of members) {
    if (m.role === OrgRole.ADMIN) continue;
    const list = map.get(m.role) ?? [];
    list.push(m);
    map.set(m.role, list);
  }
  return map;
}

async function buildRoleBuckets(
  direct: OrgMember[],
  total: OrgMember[],
  pospMembers: TeamPerson[],
  prisma: PrismaService,
  geo: GeoNameResolver,
): Promise<RoleTeamBucket[]> {
  const directByRole = groupByRole(direct);
  const totalByRole = groupByRole(total);
  const allRoles = new Set([...directByRole.keys(), ...totalByRole.keys()]);

  const uniqueMembers = [
    ...new Map([...direct, ...total].map((m) => [m.id, m])).values(),
  ];
  const enriched = await enrichMembersToPeople(prisma, uniqueMembers, geo);
  const personByCode = new Map(enriched.map((p) => [p.id, p]));

  const buckets: RoleTeamBucket[] = [...allRoles]
    .map((role) => {
      const totalMembers = totalByRole.get(role) ?? [];
      const sorted = [...totalMembers].sort((a, b) =>
        (a.userName ?? a.userCode).localeCompare(b.userName ?? b.userCode),
      );
      return {
        role,
        label: orgRoleLabel(role),
        directCount: (directByRole.get(role) ?? []).length,
        totalCount: totalMembers.length,
        members: sorted.map(
          (m) => personByCode.get(m.userCode) ?? memberToPerson(m),
        ),
      };
    })
    .sort(
      (a, b) => orgRoleRank(b.role as OrgRole) - orgRoleRank(a.role as OrgRole),
    );

  if (pospMembers.length > 0) {
    buckets.push({
      role: POSP_ROLE,
      label: 'POSPs',
      directCount: 0,
      totalCount: pospMembers.length,
      members: pospMembers,
    });
  }

  return buckets;
}

async function pospPeopleInDistricts(
  prisma: PrismaService,
  districtIds: string[] | null,
  geo: GeoNameResolver,
): Promise<TeamPerson[]> {
  if (districtIds !== null && districtIds.length === 0) return [];

  const rows = await prisma.posp.findMany({
    where: {
      active: true,
      ...(districtIds === null
        ? { districtId: { not: null } }
        : { districtId: { in: districtIds } }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      region: true,
      districtId: true,
      stateId: true,
      cityId: true,
    },
    orderBy: { name: 'asc' },
  });

  const owners = await loadDistrictOwnersByDistrictId(prisma);
  const ownerCodes = [
    ...new Set(
      rows
        .map((p) => (p.districtId ? owners.get(p.districtId)?.userCode : null))
        .filter((c): c is string => !!c),
    ),
  ];
  const ownerMembers =
    ownerCodes.length > 0
      ? await prisma.orgMember.findMany({
          where: { userCode: { in: ownerCodes } },
        })
      : [];
  const ownerByCode = new Map(ownerMembers.map((m) => [m.userCode, m]));

  return rows.map((p) => {
    let districtName: string | null = null;
    let stateName: string | null = p.region ?? null;
    let cityName: string | null = null;
    let reportsTo: TeamPersonReportsTo | null = null;

    if (p.districtId) {
      const geoDistrict = geo.districtById(p.districtId);
      const owner = owners.get(p.districtId);
      districtName = geoDistrict?.name ?? owner?.districtName ?? null;
      stateName = geoDistrict?.stateName ?? stateName ?? null;

      if (owner) {
        const manager = ownerByCode.get(owner.userCode);
        if (manager) {
          reportsTo = {
            id: manager.userCode,
            name: manager.userName ?? manager.userCode,
            role: manager.role,
            label: orgRoleLabel(manager.role),
          };
        }
      }
    }

    if (p.cityId) {
      cityName = geo.cityById(p.cityId)?.name ?? null;
    }
    if (!stateName && p.stateId) {
      stateName = geo.stateById(p.stateId)?.name ?? p.region ?? null;
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      role: POSP_ROLE,
      label: 'POSP',
      stateName,
      districtName,
      cityName,
      reportsTo,
    };
  });
}

async function resolveMemberFromUser(
  prisma: PrismaService,
  user: AuthUser,
): Promise<OrgMember | null> {
  const team = await prisma.salesTeam.findUnique({
    where: { userId: user.userId },
    select: { employeeCode: true },
  });
  if (!team) return null;
  const code = resolveOrgMemberCode(team.employeeCode);
  return prisma.orgMember.findFirst({ where: { userCode: code } });
}

async function buildNationwideDownline(
  prisma: PrismaService,
  geo: GeoNameResolver,
): Promise<DownlineTeamSummary> {
  const [members, districtRows, pospPeople] = await Promise.all([
    prisma.orgMember.findMany(),
    prisma.districtChain.findMany({
      select: { districtId: true },
      distinct: ['districtId'],
    }),
    pospPeopleInDistricts(prisma, null, geo),
  ]);

  const filtered = members.filter((m) => m.role !== OrgRole.ADMIN);
  const buckets = await buildRoleBuckets([], filtered, pospPeople, prisma, geo);
  const managerCount = filtered.length;

  return {
    mode: 'downline',
    districtCount: districtRows.length,
    pospCount: pospPeople.length,
    managerCount,
    roles: buckets,
  };
}

/**
 * Downline team summary for managers — counts and names by org role in territory.
 */
export async function buildDownlineSummary(
  prisma: PrismaService,
  user: AuthUser,
  geo: GeoNameResolver,
): Promise<DownlineTeamSummary | null> {
  const unrestricted =
    user.role === Role.SUPER_ADMIN || user.role === Role.NATIONAL_HEAD;

  const member = await resolveMemberFromUser(prisma, user);
  if (!member) {
    return unrestricted ? buildNationwideDownline(prisma, geo) : null;
  }

  const districtIds = await districtIdsForMember(prisma, member.id);
  const allowed = new Set(districtIds);
  const callerOrgRank = orgRoleRank(member.role as OrgRole);

  const [rawDirect, closureRows, pospPeople] = await Promise.all([
    directReports(prisma, member.id),
    prisma.orgClosure.findMany({
      where: { ancestorId: member.id, depth: { gt: 0 } },
      select: { descendantId: true },
    }),
    pospPeopleInDistricts(prisma, districtIds, geo),
  ]);

  const direct = await filterMembersByDistricts(prisma, rawDirect, allowed);

  const descendantIds = [...new Set(closureRows.map((c) => c.descendantId))];
  const rawTotal =
    descendantIds.length > 0
      ? await prisma.orgMember.findMany({
          where: { id: { in: descendantIds } },
        })
      : [];

  const rankFiltered = rawTotal.filter(
    (m) => orgRoleRank(m.role as OrgRole) < callerOrgRank,
  );
  const total = await filterMembersByDistricts(prisma, rankFiltered, allowed);

  const buckets = await buildRoleBuckets(
    direct,
    total,
    pospPeople,
    prisma,
    geo,
  );
  const managerCount = total.length;

  return {
    mode: 'downline',
    districtCount: districtIds.length,
    pospCount: pospPeople.length,
    managerCount,
    roles: buckets,
  };
}

/**
 * Upline reporting chain for POSP users — managers in their district, senior-first.
 */
export async function buildUplineSummary(
  prisma: PrismaService,
  posp: { districtId: string | null },
  geo: GeoNameResolver,
): Promise<UplineTeamSummary | null> {
  if (!posp.districtId) {
    return { mode: 'upline', districtName: null, reportingChain: [] };
  }

  const chains = await prisma.districtChain.findMany({
    where: { districtId: posp.districtId },
    select: { memberId: true, districtName: true, chainLevel: true },
    orderBy: { chainLevel: 'desc' },
  });

  if (chains.length === 0) {
    return {
      mode: 'upline',
      districtName: null,
      reportingChain: [],
    };
  }

  const districtName = chains[0]?.districtName ?? null;
  const memberIds = [...new Set(chains.map((c) => c.memberId))];
  const members = await prisma.orgMember.findMany({
    where: { id: { in: memberIds } },
  });
  const memberById = new Map(members.map((m) => [m.id, m]));

  const reportingChain: TeamPerson[] = [];
  const chainMembers: OrgMember[] = [];
  for (const chain of chains) {
    const m = memberById.get(chain.memberId);
    if (!m || m.role === OrgRole.ADMIN) continue;
    chainMembers.push(m);
  }

  const enriched = await enrichMembersToPeople(prisma, chainMembers, geo);
  const enrichedByCode = new Map(enriched.map((p) => [p.id, p]));
  for (const m of chainMembers) {
    reportingChain.push(enrichedByCode.get(m.userCode) ?? memberToPerson(m));
  }

  return {
    mode: 'upline',
    districtName,
    reportingChain,
  };
}
