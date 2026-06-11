export class CustomerCreatedEvent {
  constructor(
    public readonly customerId: string,
    public readonly email: string | null,
    public readonly occurredAt: Date,
  ) {}
}
