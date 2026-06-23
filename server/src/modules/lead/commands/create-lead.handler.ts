import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateLeadCommand } from './create-lead.command';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { LeadCreatedEvent } from '../events/lead-created.event';
import { PrismaService } from '../../../prisma/prisma.service';
import { resolveLeadGeo } from '../lead-geo.util';
import {
  deriveClosureTimeline,
  closureTimelineToHeatStatus,
  heatStatusToClosureTimeline,
} from '../lead-timeline.util';

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
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateLeadCommand): Promise<Lead> {
    const { dto, userId, pospId } = command;
    const expectedCloseDate = toDate(dto.expectedCloseDate);
    const closureTimeline =
      dto.closureTimeline ??
      (dto.heatStatus
        ? heatStatusToClosureTimeline(dto.heatStatus)
        : deriveClosureTimeline(expectedCloseDate ?? new Date()));
    const heatStatus =
      dto.heatStatus ?? closureTimelineToHeatStatus(closureTimeline);

    const geo = await resolveLeadGeo(this.prisma, pospId ?? null, userId);

    const lead = await this.repository.create({
      customer: { connect: { id: dto.customerId } },
      ...(dto.assignedToId && {
        assignedTo: { connect: { id: dto.assignedToId } },
      }),
      ...(pospId && { posp: { connect: { id: pospId } } }),
      product: dto.product,
      estimatedPremium: dto.estimatedPremium,
      estimatedSum: dto.estimatedSum,
      closureTimeline,
      expectedCloseDate,
      heatStatus,
      source: dto.source,
      remarks: dto.remarks,
      zoneId: geo.zoneId,
      regionId: geo.regionId,
      areaId: geo.areaId,
      districtId: geo.districtId,
    });

    this.eventBus.publish(
      new LeadCreatedEvent(lead.id, lead.customerId, new Date()),
    );
    return lead;
  }
}
