import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateDealCommand } from '../commands/create-deal.command';
import { DealRepository } from '../deal.repository';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatus } from '../../../common/constants';
import { Deal } from '@prisma/client';

function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PRP-${year}-${random}`;
}

@CommandHandler(CreateDealCommand)
export class CreateDealHandler implements ICommandHandler<CreateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDealCommand): Promise<Deal> {
    const dto = { ...command.dto };

    // Auto-generate a proposal number when the client omits it.
    if (!dto.proposal) {
      dto.proposal = generateProposalNumber();
    }

    const deal = await this.dealRepo.create(dto);
    this.eventBus.publish(
      new DealCreatedEvent(deal.id, deal.pospId, deal.status as DealStatus),
    );
    return deal;
  }
}
