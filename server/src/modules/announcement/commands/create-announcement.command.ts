import { CreateAnnouncementDto } from '../dto/create-announcement.dto';

export class CreateAnnouncementCommand {
  constructor(
    public readonly dto: CreateAnnouncementDto,
    public readonly createdBy: string,
  ) {}
}
