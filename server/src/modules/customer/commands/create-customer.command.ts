import { CreateCustomerDto } from '../dto/create-customer.dto';

export class CreateCustomerCommand {
  constructor(public readonly dto: CreateCustomerDto) {}
}
