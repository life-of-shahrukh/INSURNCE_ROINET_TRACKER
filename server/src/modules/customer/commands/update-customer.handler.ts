import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const { id, dto } = command;

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.repository.update(id, dto);
  }
}
