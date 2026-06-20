import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetActiveAnnouncementsQuery } from './get-active-announcements.query';
import { AnnouncementRepository } from '../announcement.repository';
import { Announcement } from '@prisma/client';

@QueryHandler(GetActiveAnnouncementsQuery)
export class GetActiveAnnouncementsHandler
  implements IQueryHandler<GetActiveAnnouncementsQuery>
{
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(query: GetActiveAnnouncementsQuery): Promise<Announcement[]> {
    return this.repo.findActive(query.userRole, query.userId);
  }
}
