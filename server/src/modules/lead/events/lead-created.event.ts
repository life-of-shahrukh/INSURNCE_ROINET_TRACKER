export class LeadCreatedEvent {
  constructor(
    public readonly leadId: string,
    public readonly customerId: string,
    public readonly occurredAt: Date,
  ) {}
}
