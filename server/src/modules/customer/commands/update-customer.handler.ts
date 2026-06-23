import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import { CustomerRepository } from '../customer.repository';
import { Customer } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertCustomerInScope } from '../../../common/auth/scope-assert.util';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateCustomerCommand): Promise<Customer> {
    const { id, dto, hierarchyScope } = command;

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (hierarchyScope) {
      await assertCustomerInScope(this.prisma, id, hierarchyScope);
    }

    return this.repository.update(id, dto);
  }
}
