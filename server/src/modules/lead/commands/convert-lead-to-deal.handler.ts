import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConvertLeadToDealCommand } from './convert-lead-to-deal.command';
import { BadRequestException } from '@nestjs/common';
import { LeadConvertedEvent } from '../events/lead-converted.event';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  convertLeadToDeal,
  loadLeadForConversion,
} from '../lead-conversion.util';
import { assertLeadInScope } from '../../../common/auth/scope-assert.util';

@CommandHandler(ConvertLeadToDealCommand)
export class ConvertLeadToDealHandler implements ICommandHandler<ConvertLeadToDealCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ConvertLeadToDealCommand,
  ): Promise<{ dealId: string }> {
    const { leadId, user, policyNo, hierarchyScope } = command;

    await assertLeadInScope(this.prisma, leadId, hierarchyScope);

    const lead = await loadLeadForConversion(this.prisma, leadId);
    if (!policyNo?.trim()) {
      throw new BadRequestException(
        'Policy number is required to convert lead to deal',
      );
    }

    const deal = await convertLeadToDeal(this.prisma, lead, user, {
      policyNo,
    });

    this.eventBus.publish(new LeadConvertedEvent(leadId, deal.id, new Date()));

    return { dealId: deal.id };
  }
}
