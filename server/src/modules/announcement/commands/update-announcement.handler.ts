import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateAnnouncementCommand } from './update-announcement.command';
import { AnnouncementRepository } from '../announcement.repository';
import { Announcement } from '@prisma/client';

@CommandHandler(UpdateAnnouncementCommand)
export class UpdateAnnouncementHandler
  implements ICommandHandler<UpdateAnnouncementCommand>
{
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(command: UpdateAnnouncementCommand): Promise<Announcement> {
    return this.repo.update(command.id, command.dto);
  }
}
