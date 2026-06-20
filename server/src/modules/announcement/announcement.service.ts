import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Announcement } from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementListQueryDto } from './dto/announcement-list-query.dto';
import { CreateAnnouncementCommand } from './commands/create-announcement.command';
import { UpdateAnnouncementCommand } from './commands/update-announcement.command';
import { DeleteAnnouncementCommand } from './commands/delete-announcement.command';
import { DismissAnnouncementCommand } from './commands/dismiss-announcement.command';
import { GetAllAnnouncementsQuery } from './queries/get-all-announcements.query';
import { GetActiveAnnouncementsQuery } from './queries/get-active-announcements.query';
import { AuthUser } from '../../common/auth/auth-user.interface';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class AnnouncementService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getAll(filters: AnnouncementListQueryDto): Promise<PaginatedResult<Announcement>> {
    return this.queryBus.execute(new GetAllAnnouncementsQuery(filters));
  }

  getActive(user: AuthUser): Promise<Announcement[]> {
    return this.queryBus.execute(
      new GetActiveAnnouncementsQuery(user.role, user.userId),
    );
  }

  create(dto: CreateAnnouncementDto, user: AuthUser): Promise<Announcement> {
    return this.commandBus.execute(
      new CreateAnnouncementCommand(dto, user.userId),
    );
  }

  update(
    id: string,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement> {
    return this.commandBus.execute(new UpdateAnnouncementCommand(id, dto));
  }

  delete(id: string): Promise<void> {
    return this.commandBus.execute(new DeleteAnnouncementCommand(id));
  }

  dismiss(id: string, user: AuthUser): Promise<void> {
    return this.commandBus.execute(
      new DismissAnnouncementCommand(id, user.userId),
    );
  }
}
