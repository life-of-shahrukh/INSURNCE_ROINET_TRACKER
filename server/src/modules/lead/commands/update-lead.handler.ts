import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLeadCommand } from './update-lead.command';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { LeadStatusChangedEvent } from '../events/lead-status-changed.event';

function toDate(val: Date | string | undefined | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

@CommandHandler(UpdateLeadCommand)
export class UpdateLeadHandler implements ICommandHandler<UpdateLeadCommand> {
  constructor(
    private readonly repository: LeadRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateLeadCommand): Promise<Lead> {
    const { id, dto } = command;

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.customerId) {
      updateData.customer = { connect: { id: dto.customerId } };
      delete updateData.customerId;
    }

    if (dto.assignedToId) {
      updateData.assignedTo = { connect: { id: dto.assignedToId } };
      delete updateData.assignedToId;
    }

    // Convert date string to Date object if present
    if (updateData.expectedCloseDate !== undefined) {
      updateData.expectedCloseDate = toDate(updateData.expectedCloseDate as Date | string | undefined | null);
    }

    const updated = await this.repository.update(id, updateData);

    if (dto.status && dto.status !== existing.status) {
      this.eventBus.publish(
        new LeadStatusChangedEvent(id, existing.status, dto.status, new Date()),
      );
    }

    return updated;
  }
}
