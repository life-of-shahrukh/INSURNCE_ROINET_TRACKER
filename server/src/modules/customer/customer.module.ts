import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerRepository } from './customer.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateCustomerHandler } from './commands/create-customer.handler';
import { UpdateCustomerHandler } from './commands/update-customer.handler';
import { GetAllCustomersHandler } from './queries/get-all-customers.handler';
import { SearchCustomersHandler } from './queries/search-customers.handler';
import { CustomerEventsListener } from './listeners/customer-events.listener';

const CommandHandlers = [CreateCustomerHandler, UpdateCustomerHandler];
const QueryHandlers = [GetAllCustomersHandler, SearchCustomersHandler];
const EventListeners = [CustomerEventsListener];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CustomerRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,
  ],
  exports: [CustomerService, CustomerRepository],
})
export class CustomerModule {}
