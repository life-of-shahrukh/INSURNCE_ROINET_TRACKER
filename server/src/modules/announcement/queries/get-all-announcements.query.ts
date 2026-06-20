import { AnnouncementListQueryDto } from '../dto/announcement-list-query.dto';

export class GetAllAnnouncementsQuery {
  constructor(public readonly filters: AnnouncementListQueryDto) {}
}
