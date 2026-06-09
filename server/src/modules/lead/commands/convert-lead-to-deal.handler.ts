import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ConvertLeadToDealCommand } from './convert-lead-to-deal.command';
import { LeadRepository } from '../lead.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LeadConvertedEvent } from '../events/lead-converted.event';

@CommandHandler(ConvertLeadToDealCommand)
export class ConvertLeadToDealHandler
  implements ICommandHandler<ConvertLeadToDealCommand>
{
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConvertLeadToDealCommand): Promise<{ dealId: string }> {
    const { leadId } = command;

    const lead = await this.leadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${leadId} not found`);
    }

    if (lead.status === 'WON') {
      throw new BadRequestException('Lead already converted to deal');
    }

    if (lead.status === 'LOST') {
      throw new BadRequestException('Cannot convert a lost lead to deal');
    }

    // Resolve customer name from Customer table
    const customer = await this.prisma.customer.findUnique({
      where: { id: lead.customerId },
      select: { name: true },
    });

    const deal = await this.prisma.deal.create({
      data: {
        pospId: lead.assignedToId || '', // Assigned sales team member used as POSP reference
        customerId: lead.customerId,
        customerName: customer?.name || '',
        policy: lead.product,
        sum: lead.estimatedSum || 0,
        premium: lead.estimatedPremium,
        coa: 0,
        margin: 0,
        status: 'H',
        expected: lead.expectedCloseDate || new Date(),
        proposal: '',
      },
    });

    await this.leadRepository.update(leadId, {
      status: 'WON',
      convertedToDealId: deal.id,
      convertedAt: new Date(),
    });

    this.eventBus.publish(new LeadConvertedEvent(leadId, deal.id, new Date()));

    return { dealId: deal.id };
  }
}
