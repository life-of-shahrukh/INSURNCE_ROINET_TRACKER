import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllCustomersQuery } from './get-all-customers.query';
import { CustomerRepository } from '../customer.repository';
import { Customer, Prisma } from '@prisma/client';
import { buildCustomerScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildCustomerFilterWhere } from '../customer-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import { resolvePagination } from '../../../common/utils/pagination.util';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';
import { GeoCatalogService } from '../../geo/geo-catalog.service';

@QueryHandler(GetAllCustomersQuery)
export class GetAllCustomersHandler implements IQueryHandler<GetAllCustomersQuery> {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly geo: GeoCatalogService,
  ) {}

  async execute(
    query: GetAllCustomersQuery,
  ): Promise<PaginatedResult<Customer>> {
    const { filters, hierarchyScope } = query;
    const { skip, take, page, pageSize } = resolvePagination(filters);

    const scopeWhere = hierarchyScope
      ? buildCustomerScopeWhere(hierarchyScope)
      : {};
    const districtIds = await this.geo.districtIdsForQuery(filters);
    const filterWhere = buildCustomerFilterWhere(filters, districtIds);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.CustomerWhereInput;

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
