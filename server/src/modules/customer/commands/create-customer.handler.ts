import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateCustomerCommand } from './create-customer.command';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';
import { CustomerCreatedEvent } from '../events/customer-created.event';
import { SequenceService } from '../../../common/sequence/sequence.service';

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerHandler implements ICommandHandler<CreateCustomerCommand> {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly eventBus: EventBus,
    private readonly sequenceService: SequenceService,
  ) {}

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    const { dto } = command;

    // Deduplicate by mobile — mobile is the unique identifier for a customer.
    // If a record with this phone number already exists, update their details
    // and return the existing record rather than creating a duplicate.
    const existing = await this.repository.findByMobile(dto.mobile);
    if (existing) {
      return this.repository.update(existing.id, {
        name: dto.name,
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.alternateMobile !== undefined && {
          alternateMobile: dto.alternateMobile,
        }),
        ...(dto.dateOfBirth !== undefined && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.panNumber !== undefined && { panNumber: dto.panNumber }),
        ...(dto.aadharNumber !== undefined && {
          aadharNumber: dto.aadharNumber,
        }),
        ...(dto.stateId !== undefined && { stateId: dto.stateId }),
        ...(dto.stateName !== undefined && { stateName: dto.stateName }),
        ...(dto.districtId !== undefined && { districtId: dto.districtId }),
        ...(dto.districtName !== undefined && {
          districtName: dto.districtName,
        }),
        ...(dto.cityId !== undefined && { cityId: dto.cityId }),
        ...(dto.cityName !== undefined && { cityName: dto.cityName }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.source !== undefined && { source: dto.source }),
      });
    }

    const clientCode = await this.sequenceService.nextCode('CUSTOMER');

    const customer = await this.repository.create({
      clientCode,
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
