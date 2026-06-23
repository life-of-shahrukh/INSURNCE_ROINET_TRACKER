import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateLeadCommand } from './update-lead.command';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { LeadStatusChangedEvent } from '../events/lead-status-changed.event';
import { LeadConvertedEvent } from '../events/lead-converted.event';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  deriveClosureTimeline,
  closureTimelineToHeatStatus,
  heatStatusToClosureTimeline,
} from '../lead-timeline.util';
import { convertLeadToDeal } from '../lead-conversion.util';
import { Role } from '../../../common/constants';
import { assertLeadInScope } from '../../../common/auth/scope-assert.util';

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
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateLeadCommand): Promise<Lead> {
    const { id, dto, user, hierarchyScope } = command;

    await assertLeadInScope(this.prisma, id, hierarchyScope);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Lead with ID ${id} not found`);
    }

    const { policyNo, proposal, issued, coa, coaType, margin, ...leadFields } =
      dto;

    const updateData: Record<string, unknown> = { ...leadFields };

    if (dto.customerId) {
      updateData.customer = { connect: { id: dto.customerId } };
      delete updateData.customerId;
    }

    if (dto.assignedToId) {
      updateData.assignedTo = { connect: { id: dto.assignedToId } };
      delete updateData.assignedToId;
    }

    if (updateData.expectedCloseDate !== undefined) {
      const expectedCloseDate = toDate(
        updateData.expectedCloseDate as Date | string | undefined | null,
      );
      updateData.expectedCloseDate = expectedCloseDate;
      if (!dto.closureTimeline && expectedCloseDate) {
        updateData.closureTimeline = deriveClosureTimeline(expectedCloseDate);
      }
    }

    if (dto.heatStatus && !dto.closureTimeline) {
      updateData.closureTimeline = heatStatusToClosureTimeline(dto.heatStatus);
    }
    if (dto.closureTimeline && !dto.heatStatus) {
      updateData.heatStatus = closureTimelineToHeatStatus(dto.closureTimeline);
    }
    if (
      updateData.closureTimeline &&
      updateData.heatStatus === undefined &&
      !dto.heatStatus
    ) {
      updateData.heatStatus = closureTimelineToHeatStatus(
        updateData.closureTimeline as
          | 'THIS_MONTH'
          | 'T_PLUS_1'
          | 'T_PLUS_2'
          | 'LATER',
      );
    }

    const hasLeadUpdates = Object.keys(updateData).length > 0;
    let workingLead = existing;

    if (hasLeadUpdates) {
      workingLead = await this.repository.update(id, updateData);
      if (dto.status && dto.status !== existing.status) {
        this.eventBus.publish(
          new LeadStatusChangedEvent(
            id,
            existing.status,
            dto.status,
            new Date(),
          ),
        );
      }
    }

    if (policyNo?.trim() && !workingLead.convertedToDealId) {
      const deal = await convertLeadToDeal(this.prisma, workingLead, user, {
        policyNo,
        proposal,
        issued: toDate(issued),
        coa: user.role === Role.SUPER_ADMIN ? coa : undefined,
        coaType: user.role === Role.SUPER_ADMIN ? coaType : undefined,
        margin: user.role === Role.SUPER_ADMIN ? margin : undefined,
      });

      this.eventBus.publish(new LeadConvertedEvent(id, deal.id, new Date()));

      const converted = await this.repository.findById(id);
      if (!converted) {
        throw new NotFoundException(`Lead with ID ${id} not found`);
      }
      return converted;
    }

    return workingLead;
  }
}
