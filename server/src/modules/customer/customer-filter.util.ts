import type { Prisma } from '@prisma/client';
import type { CustomerListQueryDto } from './dto/customer-list-query.dto';
import { mergeWhereClauses, resolveDateRange } from '../../common/utils/filter.util';

export function buildCustomerFilterWhere(
  query: CustomerListQueryDto,
): Prisma.CustomerWhereInput {
  const clauses: Prisma.CustomerWhereInput[] = [];
  const dateBounds = resolveDateRange(query);

  if (dateBounds) clauses.push({ createdAt: dateBounds });
  if (query.kycStatus?.length) clauses.push({ kycStatus: { in: query.kycStatus } });
  if (query.source?.length) clauses.push({ source: { in: query.source } });

  if (query.search?.trim()) {
    const term = query.search.trim();
    clauses.push({
      OR: [
        { name: { contains: term } },
        { email: { contains: term } },
        { mobile: { contains: term } },
      ],
    });
  }

  return mergeWhereClauses(...clauses) as Prisma.CustomerWhereInput;
}
