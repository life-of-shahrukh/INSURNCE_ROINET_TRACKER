export class LeadStatusChangedEvent {
  constructor(
    public readonly leadId: string,
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly occurredAt: Date,
  ) {}
}
