import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatusChangedEvent } from '../events/deal-status-changed.event';

@EventsHandler(DealCreatedEvent)
export class DealCreatedListener implements IEventHandler<DealCreatedEvent> {
  private readonly logger = new Logger(DealCreatedListener.name);

  handle(event: DealCreatedEvent) {
    this.logger.log(
      `Deal created [id=${event.dealId}] [pospId=${event.pospId}] [status=${event.status}]`,
    );
  }
}

@EventsHandler(DealStatusChangedEvent)
export class DealStatusChangedListener
  implements IEventHandler<DealStatusChangedEvent>
{
  private readonly logger = new Logger(DealStatusChangedListener.name);

  handle(event: DealStatusChangedEvent) {
    this.logger.log(
      `Deal status changed [id=${event.dealId}] [${event.previousStatus} → ${event.newStatus}]`,
    );
  }
}
