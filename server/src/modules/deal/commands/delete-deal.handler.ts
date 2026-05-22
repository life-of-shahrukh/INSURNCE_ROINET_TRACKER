import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteDealCommand } from '../commands/delete-deal.command';
import { DealRepository } from '../deal.repository';

@CommandHandler(DeleteDealCommand)
export class DeleteDealHandler implements ICommandHandler<DeleteDealCommand> {
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(command: DeleteDealCommand): Promise<void> {
    await this.dealRepo.delete(command.id);
  }
}
