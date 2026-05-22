import { CreatePospDto } from '../dto/create-posp.dto';

export class CreatePospCommand {
  constructor(public readonly dto: CreatePospDto) {}
}
