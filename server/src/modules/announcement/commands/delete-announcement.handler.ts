import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteAnnouncementCommand } from './delete-announcement.command';
import { AnnouncementRepository } from '../announcement.repository';

@CommandHandler(DeleteAnnouncementCommand)
export class DeleteAnnouncementHandler
  implements ICommandHandler<DeleteAnnouncementCommand>
{
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(command: DeleteAnnouncementCommand): Promise<void> {
    return this.repo.delete(command.id);
  }
}
