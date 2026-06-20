import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateAnnouncementCommand } from './create-announcement.command';
import { AnnouncementRepository } from '../announcement.repository';
import { Announcement } from '@prisma/client';

@CommandHandler(CreateAnnouncementCommand)
export class CreateAnnouncementHandler
  implements ICommandHandler<CreateAnnouncementCommand>
{
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(command: CreateAnnouncementCommand): Promise<Announcement> {
    return this.repo.create(command.dto, command.createdBy);
  }
}
