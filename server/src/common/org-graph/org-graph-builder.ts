/**
 * Pure transform: ListHierarchyUserData chains -> an org graph (members, edges,
 * transitive closure, district bridge). Keyed by Cognitensor UserId so it is
 * storage-agnostic; the caller maps userId -> persisted OrgMember.id.
 *
 * Used by both the runtime OrgSyncService (weekly cron) and the seed script so
 * the graph is built one way only.
 */

import type { ExternalHierarchyUser } from '../external-api/external-api.types';
import {
  mergeOrgRole,
  orgRoleFromUserType,
  parseUserType,
  refineAdminRoles,
} from '../external-api/user-type.util';
import type { OrgRole } from '../external-api/user-type.util';

export interface MemberSeed {
  userId: string;
  userCode: string;
  userName: string | null;
  userType: number | null;
  role: string;
}

export interface EdgeSeed {
  memberUserId: string;
  managerUserId: string;
}

export interface ClosureSeed {
  ancestorUserId: string;
  descendantUserId: string;
  depth: number;
}

export interface DistrictChainSeed {
  districtId: string;
  districtName: string | null;
  stateId: string | null;
  zoneId: string | null;
  zoneName: string | null;
  regionId: string | null;
  regionName: string | null;
  memberUserId: string;
  chainLevel: number;
}

/** Geography for a district, sourced from the expanded ListDistrict payload. */
export interface DistrictGeo {
  stateId: string | null;
  zoneId: string | null;
  zoneName: string | null;
  regionId: string | null;
  regionName: string | null;
}

export interface OrgGraphSeed {
  members: MemberSeed[];
  edges: EdgeSeed[];
  closures: ClosureSeed[];
  districtChains: DistrictChainSeed[];
}

interface ChainSlot {
  userId: string;
  userCode: string;
  userName: string;
  userType: string | undefined;
}

/**
 * Extracts the ordered chain for a district, bottom (owner) -> top, dropping
 * empty slots. The owner's usertype is the top-level `usertype`; each R-level
 * carries its own `R{n}_usertype`.
 */
function chainOf(entry: ExternalHierarchyUser): ChainSlot[] {
  const slots: ChainSlot[] = [
    {
      userId: entry.DistrictManagerId,
      userCode: entry.DistrictManagerCode,
      userName: entry.DistrictManagerName,
      userType: entry.usertype,
    },
  ];
  const rLevels = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'] as const;
  for (const r of rLevels) {
    slots.push({
      userId: entry[`${r}_UserId` as keyof ExternalHierarchyUser] as string,
      userCode: entry[`${r}_UserCode` as keyof ExternalHierarchyUser] as string,
      userName: entry[`${r}_UserName` as keyof ExternalHierarchyUser] as string,
      userType: entry[`${r}_usertype` as keyof ExternalHierarchyUser],
    });
  }
  return slots.filter((s) => !!s.userId && !!s.userCode);
}

/**
 * Builds the full org graph from hierarchy rows.
 * @param hierarchy   ListHierarchyUserData rows.
 * @param geoByDistrict  districtId -> geography (state/zone/region) from the
 *                       expanded ListDistrict snapshot.
 */
export function buildOrgGraph(
  hierarchy: ExternalHierarchyUser[],
  geoByDistrict: Map<string, DistrictGeo> = new Map(),
): OrgGraphSeed {
  const members = new Map<string, MemberSeed>();
  const edgeKeys = new Set<string>();
  const edges: EdgeSeed[] = [];
  // child userId -> set of parent userIds (a person can report up differently
  // across districts; closure unions all upline paths).
  const parents = new Map<string, Set<string>>();
  // (districtId|memberUserId) -> chainLevel, keeping the lowest level seen.
  const districtChainMap = new Map<string, DistrictChainSeed>();

  for (const entry of hierarchy) {
    const chain = chainOf(entry);
    if (chain.length === 0) continue;

    // Members (deduped by userId; merge usertype across districts).
    for (const slot of chain) {
      const incomingRole = orgRoleFromUserType(slot.userType);
      const incomingType = parseUserType(slot.userType);
      const existing = members.get(slot.userId);
      if (!existing) {
        members.set(slot.userId, {
          userId: slot.userId,
          userCode: slot.userCode,
          userName: slot.userName || slot.userCode,
          userType: incomingType,
          role: incomingRole,
        });
      } else {
        const mergedRole = mergeOrgRole(existing.role as OrgRole, incomingRole);
        members.set(slot.userId, {
          ...existing,
          userName: existing.userName || slot.userName || slot.userCode,
          userType:
            existing.userType !== null && incomingType !== null
              ? Math.max(existing.userType, incomingType)
              : (existing.userType ?? incomingType),
          role: mergedRole,
        });
      }
    }

    // Edges: chain[i] reports to chain[i+1].
    for (let i = 0; i < chain.length - 1; i++) {
      const child = chain[i].userId;
      const parent = chain[i + 1].userId;
      if (child === parent) continue;
      const key = `${child}|${parent}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push({ memberUserId: child, managerUserId: parent });
      }
      if (!parents.has(child)) parents.set(child, new Set());
      parents.get(child)!.add(parent);
    }

    // District bridge: every member in the chain covers this district.
    const districtId = entry.DistrictId;
    if (districtId) {
      const geo = geoByDistrict.get(districtId);
      chain.forEach((slot, level) => {
        const key = `${districtId}|${slot.userId}`;
        const existing = districtChainMap.get(key);
        if (!existing || level < existing.chainLevel) {
          districtChainMap.set(key, {
            districtId,
            districtName: entry.DistrictName || null,
            stateId: geo?.stateId ?? null,
            zoneId: geo?.zoneId ?? null,
            zoneName: geo?.zoneName ?? null,
            regionId: geo?.regionId ?? null,
            regionName: geo?.regionName ?? null,
            memberUserId: slot.userId,
            chainLevel: level,
          });
        }
      });
    }
  }

  const memberList = [...members.values()];
  refineAdminRoles(memberList, edges);

  return {
    members: memberList,
    edges,
    closures: buildClosure([...members.keys()], parents),
    districtChains: [...districtChainMap.values()],
  };
}

/**
 * Transitive closure from the child->parents adjacency. For each member we walk
 * upward (BFS) collecting every ancestor with the shortest depth, plus a self
 * row at depth 0. Chains are shallow (<8) so this stays cheap.
 */
function buildClosure(
  memberIds: string[],
  parents: Map<string, Set<string>>,
): ClosureSeed[] {
  const closures: ClosureSeed[] = [];

  for (const descendant of memberIds) {
    closures.push({
      ancestorUserId: descendant,
      descendantUserId: descendant,
      depth: 0,
    });

    const bestDepth = new Map<string, number>();
    let frontier: string[] = [...(parents.get(descendant) ?? [])];
    let depth = 1;
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const ancestor of frontier) {
        if (ancestor === descendant) continue; // guard against cycles
        const prev = bestDepth.get(ancestor);
        if (prev === undefined || depth < prev) {
          bestDepth.set(ancestor, depth);
          for (const p of parents.get(ancestor) ?? []) next.push(p);
        }
      }
      frontier = next;
      depth++;
      if (depth > 32) break; // safety: malformed cyclic data
    }

    for (const [ancestor, d] of bestDepth) {
      closures.push({
        ancestorUserId: ancestor,
        descendantUserId: descendant,
        depth: d,
      });
    }
  }

  return closures;
}
