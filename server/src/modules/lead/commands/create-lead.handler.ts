import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateLeadCommand } from './create-lead.command';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { LeadCreatedEvent } from '../events/lead-created.event';

/** Convert any date-like value (Date object or "YYYY-MM-DD" string) to a Date. */
function toDate(val: Date | string | undefined | null): Date | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? undefined : d;
}

@CommandHandler(CreateLeadCommand)
export class CreateLeadHandler implements ICommandHandler<CreateLeadCommand> {
  constructor(
    private readonly repository: LeadRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateLeadCommand): Promise<Lead> {
    const { dto } = command;

    const lead = await this.repository.create({
      customer: { connect: { id: dto.customerId } },
      ...(dto.assignedToId && {
        assignedTo: { connect: { id: dto.assignedToId } },
      }),
      product:           dto.product,
      estimatedPremium:  dto.estimatedPremium,
      estimatedSum:      dto.estimatedSum,
      closureTimeline:   dto.closureTimeline,
      expectedCloseDate: toDate(dto.expectedCloseDate as unknown as string | Date | undefined),
      source:            dto.source,
      remarks:           dto.remarks,
    });

    this.eventBus.publish(new LeadCreatedEvent(lead.id, lead.customerId, new Date()));
    return lead;
  }
}
