import { UpdateAnnouncementDto } from '../dto/update-announcement.dto';

export class UpdateAnnouncementCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateAnnouncementDto,
  ) {}
}
