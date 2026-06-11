import type { CustomerListQueryDto } from '../dto/customer-list-query.dto';

export class GetAllCustomersQuery {
  constructor(public readonly filters: CustomerListQueryDto) {}
}
