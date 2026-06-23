import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeleteLeadCommand } from './delete-lead.command';
import { LeadRepository } from '../lead.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertLeadInScope } from '../../../common/auth/scope-assert.util';

@CommandHandler(DeleteLeadCommand)
export class DeleteLeadHandler implements ICommandHandler<DeleteLeadCommand> {
  constructor(
    private readonly repository: LeadRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: DeleteLeadCommand): Promise<void> {
    await assertLeadInScope(this.prisma, command.id, command.hierarchyScope);

    const lead = await this.repository.findById(command.id);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${command.id} not found`);
    }

    if (lead.convertedToDealId) {
      throw new BadRequestException(
        'This lead was converted to a deal. Delete it from Deals Tracker first.',
      );
    }

    await this.repository.delete(command.id);
  }
}
