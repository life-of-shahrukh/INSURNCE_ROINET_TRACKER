import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetAllAnnouncementsQuery } from './get-all-announcements.query';
import { AnnouncementRepository } from '../announcement.repository';
import { Announcement } from '@prisma/client';
import type { PaginatedResult } from '../../../common/interfaces/paginated-result.interface';

@QueryHandler(GetAllAnnouncementsQuery)
export class GetAllAnnouncementsHandler
  implements IQueryHandler<GetAllAnnouncementsQuery>
{
  constructor(private readonly repo: AnnouncementRepository) {}

  execute(
    query: GetAllAnnouncementsQuery,
  ): Promise<PaginatedResult<Announcement>> {
    return this.repo.findAllPaginated(query.filters);
  }
}
