import { DealStatus } from '../../../common/constants';

export class DealCreatedEvent {
  constructor(
    public readonly dealId: string,
    public readonly pospId: string | null,
    public readonly status: DealStatus,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
