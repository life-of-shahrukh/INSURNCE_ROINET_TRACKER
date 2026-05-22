import { UpdatePospDto } from '../dto/update-posp.dto';

export class UpdatePospCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdatePospDto,
  ) {}
}
