import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateDealCommand } from '../commands/create-deal.command';
import { DealRepository } from '../deal.repository';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatus } from '../../../common/constants';
import { Deal } from '@prisma/client';

@CommandHandler(CreateDealCommand)
export class CreateDealHandler implements ICommandHandler<CreateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateDealCommand): Promise<Deal> {
    const deal = await this.dealRepo.create(command.dto);
    this.eventBus.publish(
      new DealCreatedEvent(deal.id, deal.pospId, deal.status as DealStatus),
    );
    return deal;
  }
}
