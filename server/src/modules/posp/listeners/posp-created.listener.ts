import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PospCreatedEvent } from '../events/posp-created.event';

@EventsHandler(PospCreatedEvent)
export class PospCreatedListener implements IEventHandler<PospCreatedEvent> {
  private readonly logger = new Logger(PospCreatedListener.name);

  async handle(event: PospCreatedEvent): Promise<void> {
    try {
      this.logger.log(
        `POSP created [id=${event.pospId}] [email=${event.email}] — welcome notification queued`,
      );
      
      // Future: Add side effects like sending welcome email, analytics, etc.
      // await this.emailService.sendWelcomeEmail(event.email, event.pospId);
    } catch (error) {
      this.logger.error(
        `Failed to handle PospCreatedEvent for posp ${event.pospId}`,
        error,
      );
      // Don't throw - listeners should not break the main flow
    }
  }
}
