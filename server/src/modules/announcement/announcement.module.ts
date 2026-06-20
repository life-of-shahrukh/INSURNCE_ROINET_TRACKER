import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { AnnouncementRepository } from './announcement.repository';
import { CreateAnnouncementHandler } from './commands/create-announcement.handler';
import { UpdateAnnouncementHandler } from './commands/update-announcement.handler';
import { DeleteAnnouncementHandler } from './commands/delete-announcement.handler';
import { DismissAnnouncementHandler } from './commands/dismiss-announcement.handler';
import { GetAllAnnouncementsHandler } from './queries/get-all-announcements.handler';
import { GetActiveAnnouncementsHandler } from './queries/get-active-announcements.handler';

const CommandHandlers = [
  CreateAnnouncementHandler,
  UpdateAnnouncementHandler,
  DeleteAnnouncementHandler,
  DismissAnnouncementHandler,
];

const QueryHandlers = [
  GetAllAnnouncementsHandler,
  GetActiveAnnouncementsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AnnouncementController],
  providers: [
    AnnouncementService,
    AnnouncementRepository,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class AnnouncementModule {}
