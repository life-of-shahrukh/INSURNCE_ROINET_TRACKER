import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerCommand } from './commands/create-customer.command';
import { UpdateCustomerCommand } from './commands/update-customer.command';
import { GetAllCustomersQuery } from './queries/get-all-customers.query';
import { SearchCustomersQuery } from './queries/search-customers.query';
import { Customer } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.commandBus.execute(new CreateCustomerCommand(dto));
  }

  async findAll(): Promise<Customer[]> {
    return this.queryBus.execute(new GetAllCustomersQuery());
  }

  async search(query: string): Promise<Customer[]> {
    return this.queryBus.execute(new SearchCustomersQuery(query));
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    return this.commandBus.execute(new UpdateCustomerCommand(id, dto));
  }
}
