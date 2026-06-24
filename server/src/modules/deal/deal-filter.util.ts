import type { Prisma } from '@prisma/client';
import type { DealListQueryDto } from './dto/deal-list-query.dto';
import {
  buildGeoFilterWhere,
  buildPolicyStatusWhere,
  mergeWhereClauses,
  parsePremiumRange,
  resolveDateRange,
} from '../../common/utils/filter.util';

export function buildDealFilterWhere(
  query: DealListQueryDto,
  districtIds?: string[] | null,
): Prisma.DealWhereInput {
  const geo = buildGeoFilterWhere(query, districtIds);
  const dateBounds = resolveDateRange(query);
  const policyWhere = buildPolicyStatusWhere(query.policyStatus);

  const clauses: Prisma.DealWhereInput[] = [];

  if (Object.keys(geo).length > 0) clauses.push(geo);
  if (dateBounds) {
    const dateField = query.renewals === 'true' ? 'issued' : 'expected';
    clauses.push({ [dateField]: dateBounds });
  }
  if (query.dealStatus?.length)
    clauses.push({ status: { in: query.dealStatus } });
  if (query.productLine?.length)
    clauses.push({ productLine: { in: query.productLine } });
  if (query.productSubType?.length) {
    clauses.push({ productSubType: { in: query.productSubType } });
  }
  if (query.insurer?.length) clauses.push({ insurer: { in: query.insurer } });
  if (policyWhere) clauses.push(policyWhere);

  const premium = query.premiumRange
    ? parsePremiumRange(query.premiumRange)
    : undefined;
  if (premium) {
    clauses.push({
      premium: {
        ...(premium.gte !== undefined ? { gte: premium.gte } : {}),
        ...(premium.lte !== undefined ? { lte: premium.lte } : {}),
      },
    });
  }

  if (query.renewals === 'true') {
    clauses.push({ issued: { not: null } });
  }

  if (query.wonOnly === 'true') {
    clauses.push({ policyNo: { not: '' } });
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    clauses.push({
      OR: [
        { customerName: { contains: term } },
        { policy: { contains: term } },
        { productLine: { contains: term } },
        { insurer: { contains: term } },
        { proposal: { contains: term } },
        { policyNo: { contains: term } },
      ],
    });
  }

  return mergeWhereClauses(...clauses);
}
