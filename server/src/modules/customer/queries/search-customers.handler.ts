import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SearchCustomersQuery } from './search-customers.query';
import { CustomerRepository } from '../customer.repository';
import { buildCustomerScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { Customer } from '@prisma/client';

@QueryHandler(SearchCustomersQuery)
export class SearchCustomersHandler implements IQueryHandler<SearchCustomersQuery> {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(query: SearchCustomersQuery): Promise<Customer[]> {
    const scopeWhere = query.hierarchyScope
      ? buildCustomerScopeWhere(query.hierarchyScope)
      : undefined;
    return this.repository.search(query.query, scopeWhere);
  }
}
