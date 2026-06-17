import type { Prisma } from '@prisma/client';
import type { PospListQueryDto } from './dto/posp-list-query.dto';
import {
  buildGeoFilterWhere,
  mergeWhereClauses,
  resolveDateRange,
} from '../../common/utils/filter.util';

export function buildPospFilterWhere(
  query: PospListQueryDto,
): Prisma.PospWhereInput {
  const geo = buildGeoFilterWhere(query);
  const dateBounds = resolveDateRange(query);
  const clauses: Prisma.PospWhereInput[] = [];

  if (Object.keys(geo).length > 0) clauses.push(geo);
  if (dateBounds) clauses.push({ joined: dateBounds });
  if (query.active === 'true') clauses.push({ active: true });
  if (query.active === 'false') clauses.push({ active: false });
  if (query.stateId) clauses.push({ stateId: query.stateId });
  if (query.cityId) clauses.push({ cityId: query.cityId });

  if (query.search?.trim()) {
    const term = query.search.trim();
    clauses.push({
      OR: [
        { name: { contains: term } },
        { email: { contains: term } },
        { mobile: { contains: term } },
        { code: { contains: term } },
      ],
    });
  }

  return mergeWhereClauses(...clauses);
}
