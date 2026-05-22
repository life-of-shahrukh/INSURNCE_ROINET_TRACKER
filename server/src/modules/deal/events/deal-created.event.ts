import { DealStatus } from '@prisma/client';

export class DealCreatedEvent {
  constructor(
    public readonly dealId: string,
    public readonly pospId: string,
    public readonly status: DealStatus,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
