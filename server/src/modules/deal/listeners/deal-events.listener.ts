import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatusChangedEvent } from '../events/deal-status-changed.event';

@EventsHandler(DealCreatedEvent)
export class DealCreatedListener implements IEventHandler<DealCreatedEvent> {
  private readonly logger = new Logger(DealCreatedListener.name);

  async handle(event: DealCreatedEvent): Promise<void> {
    try {
      this.logger.log(
        `Deal created [id=${event.dealId}] [pospId=${event.pospId}] [status=${event.status}]`,
      );

      // Future: Add side effects like notifications, analytics, etc.
      // await this.notificationService.notifyPospOfNewDeal(event.pospId, event.dealId);
    } catch (error) {
      this.logger.error(
        `Failed to handle DealCreatedEvent for deal ${event.dealId}`,
        error,
      );
      // Don't throw - listeners should not break the main flow
    }
  }
}

@EventsHandler(DealStatusChangedEvent)
export class DealStatusChangedListener implements IEventHandler<DealStatusChangedEvent> {
  private readonly logger = new Logger(DealStatusChangedListener.name);

  async handle(event: DealStatusChangedEvent): Promise<void> {
    try {
      this.logger.log(
        `Deal status changed [id=${event.dealId}] [${event.previousStatus} → ${event.newStatus}]`,
      );

      // Future: Add side effects like notifications, analytics, etc.
      // await this.analyticsService.trackStatusChange(event);
    } catch (error) {
      this.logger.error(
        `Failed to handle DealStatusChangedEvent for deal ${event.dealId}`,
        error,
      );
      // Don't throw - listeners should not break the main flow
    }
  }
}
