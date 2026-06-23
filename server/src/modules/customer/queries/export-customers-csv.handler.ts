import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportCustomersCsvQuery } from './export-customers-csv.query';
import { CustomerRepository } from '../customer.repository';
import { buildCustomerScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildCustomerFilterWhere } from '../customer-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import type { Prisma } from '@prisma/client';
import { GeoCatalogService } from '../../geo/geo-catalog.service';

@QueryHandler(ExportCustomersCsvQuery)
export class ExportCustomersCsvHandler implements IQueryHandler<ExportCustomersCsvQuery> {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly geo: GeoCatalogService,
  ) {}

  async execute(query: ExportCustomersCsvQuery): Promise<string> {
    const { filters, hierarchyScope } = query;
    const scopeWhere = hierarchyScope
      ? buildCustomerScopeWhere(hierarchyScope)
      : {};
    const districtIds = this.geo.districtIdsForQuery(filters);
    const filterWhere = buildCustomerFilterWhere(filters, districtIds);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.CustomerWhereInput;
    return this.repo.exportCsvWhere(where);
  }
}
