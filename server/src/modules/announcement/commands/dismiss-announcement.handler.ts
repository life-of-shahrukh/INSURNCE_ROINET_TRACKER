import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DismissAnnouncementCommand } from './dismiss-announcement.command';
import { AnnouncementRepository } from '../announcement.repository';

@CommandHandler(DismissAnnouncementCommand)
export class DismissAnnouncementHandler implements ICommandHandler<DismissAnnouncementCommand> {
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(command: DismissAnnouncementCommand): Promise<void> {
    return this.repo.dismiss(command.announcementId, command.userId);
  }
}
