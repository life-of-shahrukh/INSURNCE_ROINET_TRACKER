import type { Prisma } from '@prisma/client';
import type { SalesTeamListQueryDto } from './dto/sales-team-list-query.dto';
import {
  buildGeoFilterWhere,
  mergeWhereClauses,
} from '../../common/utils/filter.util';

export function buildSalesTeamFilterWhere(
  query: SalesTeamListQueryDto,
): Prisma.SalesTeamWhereInput {
  const geo = buildGeoFilterWhere(query);
  const clauses: Prisma.SalesTeamWhereInput[] = [];

  if (Object.keys(geo).length > 0) {
    const { pospId: _pospId, districtId, ...teamGeo } = geo;
    if (Object.keys(teamGeo).length > 0) clauses.push(teamGeo);
    if (districtId !== undefined) clauses.push({ areaId: districtId });
  }

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
