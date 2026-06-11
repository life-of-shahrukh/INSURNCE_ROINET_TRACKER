export class LeadConvertedEvent {
  constructor(
    public readonly leadId: string,
    public readonly dealId: string,
    public readonly occurredAt: Date,
  ) {}
}
