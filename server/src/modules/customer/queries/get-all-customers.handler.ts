import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllCustomersQuery } from './get-all-customers.query';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';
import { buildCustomerFilterWhere } from '../customer-filter.util';
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
    const { filters } = query;
    const { skip, take, page, pageSize } = resolvePagination(filters);
    const districtIds = this.geo.districtIdsForQuery(filters);
    const where = buildCustomerFilterWhere(filters, districtIds);

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
