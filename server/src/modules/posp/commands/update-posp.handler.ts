import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdatePospCommand } from '../commands/update-posp.command';
import { PospRepository } from '../posp.repository';
import { Posp } from '@prisma/client';

@CommandHandler(UpdatePospCommand)
export class UpdatePospHandler implements ICommandHandler<UpdatePospCommand> {
  constructor(private readonly pospRepo: PospRepository) {}

  async execute(command: UpdatePospCommand): Promise<Posp> {
    return this.pospRepo.update(command.id, command.dto);
  }
}
