import { CreateDealDto } from '../dto/create-deal.dto';

export class CreateDealCommand {
  constructor(
    public readonly dto: CreateDealDto,
    /** userId of the authenticated user creating the deal — used to resolve geo scope */
    public readonly userId: string,
  ) {}
}
