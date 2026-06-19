import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllLeadsQuery } from './get-all-leads.query';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { buildLeadScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildLeadFilterWhere } from '../lead-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import { resolvePagination } from '../../../common/utils/pagination.util';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import type { Prisma } from '@prisma/client';
import { GeoCatalogService } from '../../geo/geo-catalog.service';

@QueryHandler(GetAllLeadsQuery)
export class GetAllLeadsHandler implements IQueryHandler<GetAllLeadsQuery> {
  constructor(
    private readonly repository: LeadRepository,
    private readonly geo: GeoCatalogService,
  ) {}

  async execute(query: GetAllLeadsQuery): Promise<PaginatedResult<Lead>> {
    const { filters, hierarchyScope } = query;
    const { skip, take, page, pageSize } = resolvePagination(filters);

    const scopeWhere = hierarchyScope
      ? buildLeadScopeWhere(hierarchyScope)
      : {};
    const districtIds = this.geo.districtIdsForQuery(filters);
    const filterWhere = buildLeadFilterWhere(filters, districtIds);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.LeadWhereInput;

    return this.repository.findPaginated(
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
