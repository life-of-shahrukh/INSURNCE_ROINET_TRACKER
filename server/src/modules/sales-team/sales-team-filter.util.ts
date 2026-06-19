import type { Prisma } from '@prisma/client';
import type { SalesTeamListQueryDto } from './dto/sales-team-list-query.dto';
import { mergeWhereClauses } from '../../common/utils/filter.util';

export function buildSalesTeamFilterWhere(
  query: SalesTeamListQueryDto,
): Prisma.SalesTeamWhereInput {
  const clauses: Prisma.SalesTeamWhereInput[] = [];

  // SalesTeam carries org/area-level territory columns (no Cognitensor
  // districtId), so geo is matched directly against its own columns here rather
  // than going through the district-resolving shared builder. A `district`
  // selection is treated as the team's `areaId`.
  if (query.zone?.length) clauses.push({ zoneId: { in: query.zone } });
  if (query.region?.length) clauses.push({ regionId: { in: query.region } });
  if (query.area?.length) clauses.push({ areaId: { in: query.area } });
  if (query.district?.length) clauses.push({ areaId: { in: query.district } });

  if (query.designation) clauses.push({ designation: query.designation });
  if (query.status) clauses.push({ status: query.status });
  if (query.territory) {
    clauses.push({ territory: { contains: query.territory } });
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    clauses.push({
      OR: [
        { name: { contains: term } },
        { email: { contains: term } },
        { mobile: { contains: term } },
        { employeeCode: { contains: term } },
      ],
    });
  }

  return mergeWhereClauses(...clauses);
}
