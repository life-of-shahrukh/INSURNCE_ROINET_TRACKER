import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllPospQuery } from './get-all-posp.query';
import { PospRepository } from '../posp.repository';
import { Posp } from '@prisma/client';
import { buildPospScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildPospFilterWhere } from '../posp-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import { resolvePagination } from '../../../common/utils/pagination.util';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import type { Prisma } from '@prisma/client';

@QueryHandler(GetAllPospQuery)
export class GetAllPospHandler implements IQueryHandler<GetAllPospQuery> {
  constructor(private readonly pospRepo: PospRepository) {}

  async execute(query: GetAllPospQuery): Promise<PaginatedResult<Posp>> {
    const { filters, hierarchyScope } = query;
    const { skip, take, page, pageSize } = resolvePagination(filters);

    const scopeWhere = hierarchyScope
      ? buildPospScopeWhere(hierarchyScope)
      : {};
    const filterWhere = buildPospFilterWhere(filters);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.PospWhereInput;

    return this.pospRepo.findPaginated(
      where,
      skip,
      take,
      page,
      pageSize,
      filters.sortBy,
      filters.sortOrder,
    );
  }
}
