import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchCustomersQuery } from './search-customers.query';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';

@QueryHandler(SearchCustomersQuery)
export class SearchCustomersHandler implements IQueryHandler<SearchCustomersQuery> {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(query: SearchCustomersQuery): Promise<Customer[]> {
    return this.repository.search(query.query);
  }
}
