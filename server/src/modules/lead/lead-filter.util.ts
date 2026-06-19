import type { Prisma } from '@prisma/client';
import type { LeadListQueryDto } from './dto/lead-list-query.dto';
import {
  buildGeoFilterWhere,
  mergeWhereClauses,
  resolveDateRange,
} from '../../common/utils/filter.util';

export function buildLeadFilterWhere(
  query: LeadListQueryDto,
  districtIds?: string[] | null,
): Prisma.LeadWhereInput {
  const geo = buildGeoFilterWhere(query, districtIds);
  const dateBounds = resolveDateRange(query);

  const clauses: Prisma.LeadWhereInput[] = [];

  if (Object.keys(geo).length > 0) clauses.push(geo);
  if (dateBounds) clauses.push({ createdAt: dateBounds });
  if (query.status) clauses.push({ status: query.status });
  if (query.closureTimeline)
    clauses.push({ closureTimeline: query.closureTimeline });
  if (query.productLine?.length)
    clauses.push({ product: { in: query.productLine } });
  if (query.productSubType?.length) {
    clauses.push({ productSubType: { in: query.productSubType } });
  }
  if (query.source?.length) clauses.push({ source: { in: query.source } });

  if (query.search?.trim()) {
    const term = query.search.trim();
    clauses.push({
      OR: [
        { product: { contains: term } },
        { productSubType: { contains: term } },
        { customer: { name: { contains: term } } },
      ],
    });
  }

  return mergeWhereClauses(...clauses);
}
