import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateCustomerCommand } from './create-customer.command';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';
import { CustomerCreatedEvent } from '../events/customer-created.event';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler
  implements ICommandHandler<CreateCustomerCommand>
{
  constructor(
    private readonly repository: CustomerRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    const { dto } = command;

    const customer = await this.repository.create({
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      alternateMobile: dto.alternateMobile,
      dateOfBirth: dto.dateOfBirth,
      panNumber: dto.panNumber,
      aadharNumber: dto.aadharNumber,
      stateId: dto.stateId,
      stateName: dto.stateName,
      districtId: dto.districtId,
      districtName: dto.districtName,
      cityId: dto.cityId,
      cityName: dto.cityName,
      address: dto.address,
      pincode: dto.pincode,
      source: dto.source,
    });

    this.eventBus.publish(
      new CustomerCreatedEvent(customer.id, customer.email, new Date()),
    );

    return customer;
  }
}
