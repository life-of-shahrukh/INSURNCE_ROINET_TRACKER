import { CreateDealDto } from '../dto/create-deal.dto';

export class CreateDealCommand {
  constructor(public readonly dto: CreateDealDto) {}
}
