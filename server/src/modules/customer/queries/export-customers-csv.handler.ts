import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportCustomersCsvQuery } from './export-customers-csv.query';
import { CustomerRepository } from '../customer.repository';
import { buildCustomerFilterWhere } from '../customer-filter.util';
import { GeoCatalogService } from '../../geo/geo-catalog.service';
@QueryHandler(ExportCustomersCsvQuery)
export class ExportCustomersCsvHandler implements IQueryHandler<ExportCustomersCsvQuery> {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly geo: GeoCatalogService,
  ) {}

  async execute(query: ExportCustomersCsvQuery): Promise<string> {
    const districtIds = await this.geo.districtIdsForQuery(query.filters);
    const where = buildCustomerFilterWhere(query.filters, districtIds);
    return this.repo.exportCsvWhere(where);
  }
}
