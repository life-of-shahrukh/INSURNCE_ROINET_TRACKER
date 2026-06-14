import type { CustomerListQueryDto } from '../dto/customer-list-query.dto';

export class ExportCustomersCsvQuery {
  constructor(public readonly filters: CustomerListQueryDto) {}
}
