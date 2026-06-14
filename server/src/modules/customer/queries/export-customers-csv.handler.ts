import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportCustomersCsvQuery } from './export-customers-csv.query';
import { CustomerRepository } from '../customer.repository';
import { buildCustomerFilterWhere } from '../customer-filter.util';
@QueryHandler(ExportCustomersCsvQuery)
export class ExportCustomersCsvHandler implements IQueryHandler<ExportCustomersCsvQuery> {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(query: ExportCustomersCsvQuery): Promise<string> {
    const where = buildCustomerFilterWhere(query.filters);
    return this.repo.exportCsvWhere(where);
  }
}
