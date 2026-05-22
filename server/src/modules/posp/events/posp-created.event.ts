export class PospCreatedEvent {
  constructor(
    public readonly pospId: string,
    public readonly email: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
