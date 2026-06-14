import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportCustomersCsvQuery } from './export-customers-csv.query';
import { CustomerRepository } from '../customer.repository';
import { buildCustomerFilterWhere } from '../customer-filter.util';
import type { Prisma } from '@prisma/client';

@QueryHandler(ExportCustomersCsvQuery)
export class ExportCustomersCsvHandler
  implements IQueryHandler<ExportCustomersCsvQuery>
{
  constructor(private readonly repo: CustomerRepository) {}

  async execute(query: ExportCustomersCsvQuery): Promise<string> {
    const where = buildCustomerFilterWhere(query.filters) as Prisma.CustomerWhereInput;
    return this.repo.exportCsvWhere(where);
  }
}
