import { Injectable, Inject } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    this.logger.info('Creating customer', {
      context: 'CustomerService',
      mobile: dto.mobile,
    });
    const customer = await this.commandBus.execute<CreateCustomerCommand, Customer>(
      new CreateCustomerCommand(dto),
    );
    this.logger.info('Customer created', {
      context: 'CustomerService',
      customerId: customer.id,
      clientCode: customer.clientCode,
    });
    return customer;
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
    this.logger.info('Updating customer', {
      context: 'CustomerService',
      customerId: id,
      fields: Object.keys(dto),
    });
    const customer = await this.commandBus.execute<UpdateCustomerCommand, Customer>(
      new UpdateCustomerCommand(id, dto, hierarchyScope),
    );
    this.logger.info('Customer updated', {
      context: 'CustomerService',
      customerId: id,
    });
    return customer;
  }

  exportCsv(
    filters: CustomerListQueryDto,
    hierarchyScope?: HierarchyScope,
  ): Promise<string> {
    this.logger.info('Exporting customers CSV', { context: 'CustomerService' });
    return this.queryBus.execute(
      new ExportCustomersCsvQuery(filters, hierarchyScope),
    );
  }
}
