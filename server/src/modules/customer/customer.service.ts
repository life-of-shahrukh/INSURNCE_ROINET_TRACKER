import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerCommand } from './commands/create-customer.command';
import { UpdateCustomerCommand } from './commands/update-customer.command';
import { GetAllCustomersQuery } from './queries/get-all-customers.query';
import { SearchCustomersQuery } from './queries/search-customers.query';
import { ExportCustomersCsvQuery } from './queries/export-customers-csv.query';
import { Customer } from '@prisma/client';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class CustomerService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.commandBus.execute(new CreateCustomerCommand(dto));
  }

  async findAll(
    filters: CustomerListQueryDto,
    hierarchyScope?: HierarchyScope,
  ): Promise<PaginatedResult<Customer>> {
    return this.queryBus.execute(
      new GetAllCustomersQuery(filters, hierarchyScope),
    );
  }

  async search(
    query: string,
    hierarchyScope?: HierarchyScope,
  ): Promise<Customer[]> {
    return this.queryBus.execute(
      new SearchCustomersQuery(query, hierarchyScope),
    );
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    hierarchyScope?: HierarchyScope,
  ): Promise<Customer> {
    return this.commandBus.execute(
      new UpdateCustomerCommand(id, dto, hierarchyScope),
    );
  }

  exportCsv(
    filters: CustomerListQueryDto,
    hierarchyScope?: HierarchyScope,
  ): Promise<string> {
    return this.queryBus.execute(
      new ExportCustomersCsvQuery(filters, hierarchyScope),
    );
  }
}
