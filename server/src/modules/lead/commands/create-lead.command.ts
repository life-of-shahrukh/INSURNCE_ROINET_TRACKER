import { CreateLeadDto } from '../dto/create-lead.dto';

export class CreateLeadCommand {
  constructor(
    public readonly dto: CreateLeadDto,
    public readonly userId: string,
    public readonly pospId: string | undefined,
  ) {}
}
