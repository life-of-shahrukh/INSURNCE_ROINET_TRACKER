import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllCustomersQuery } from './get-all-customers.query';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';

@QueryHandler(GetAllCustomersQuery)
export class GetAllCustomersHandler
  implements IQueryHandler<GetAllCustomersQuery>
{
  constructor(private readonly repository: CustomerRepository) {}

  async execute(): Promise<Customer[]> {
    return this.repository.findAll();
  }
}
