import { UpdateDealDto } from '../dto/update-deal.dto';

export class UpdateDealCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateDealDto,
  ) {}
}
