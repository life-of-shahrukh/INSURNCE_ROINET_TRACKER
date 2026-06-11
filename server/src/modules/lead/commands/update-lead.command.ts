import { UpdateLeadDto } from '../dto/update-lead.dto';

export class UpdateLeadCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateLeadDto,
  ) {}
}
