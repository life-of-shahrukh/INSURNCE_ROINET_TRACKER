import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDealCommand } from '../commands/update-deal.command';
import { DealRepository } from '../deal.repository';
import { DealStatusChangedEvent } from '../events/deal-status-changed.event';
import { DealStatus } from '../../../common/constants';
import { Deal } from '@prisma/client';

@CommandHandler(UpdateDealCommand)
export class UpdateDealHandler implements ICommandHandler<UpdateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateDealCommand): Promise<Deal> {
    const before = await this.dealRepo.findById(command.id);
    const updated = await this.dealRepo.update(command.id, command.dto);

    if (command.dto.status && command.dto.status !== before.status) {
      this.eventBus.publish(
        new DealStatusChangedEvent(
          updated.id,
          before.status as DealStatus,
          updated.status as DealStatus,
        ),
      );
    }

    return updated;
  }
}
