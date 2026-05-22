import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreatePospCommand } from '../commands/create-posp.command';
import { PospRepository } from '../posp.repository';
import { PospCreatedEvent } from '../events/posp-created.event';
import { Posp } from '@prisma/client';

@CommandHandler(CreatePospCommand)
export class CreatePospHandler implements ICommandHandler<CreatePospCommand> {
  constructor(
    private readonly pospRepo: PospRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreatePospCommand): Promise<Posp> {
    const posp = await this.pospRepo.create(command.dto);
    this.eventBus.publish(new PospCreatedEvent(posp.id, posp.email));
    return posp;
  }
}
