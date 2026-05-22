import { DealStatus } from '@prisma/client';

export class DealStatusChangedEvent {
  constructor(
    public readonly dealId: string,
    public readonly previousStatus: DealStatus,
    public readonly newStatus: DealStatus,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
