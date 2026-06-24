import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllDealsQuery } from './get-all-deals.query';
import { DealRepository } from '../deal.repository';
import { buildDealScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildDealFilterWhere } from '../deal-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import { resolvePagination } from '../../../common/utils/pagination.util';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { Deal } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { GeoCatalogService } from '../../geo/geo-catalog.service';

@QueryHandler(GetAllDealsQuery)
export class GetAllDealsHandler implements IQueryHandler<GetAllDealsQuery> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly geo: GeoCatalogService,
  ) {}

  async execute(query: GetAllDealsQuery): Promise<PaginatedResult<Deal>> {
    const { filters, hierarchyScope, pospId } = query;
    const { skip, take, page, pageSize } = resolvePagination(filters);

    let scopeWhere: Record<string, unknown> = {};
    if (pospId && !hierarchyScope) {
      scopeWhere = { pospId };
    } else if (hierarchyScope) {
      scopeWhere = buildDealScopeWhere(hierarchyScope);
    }

    const districtIds = await this.geo.districtIdsForQuery(filters);
    const filterWhere = buildDealFilterWhere(filters, districtIds);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.DealWhereInput;

    return this.dealRepo.findPaginated(
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
