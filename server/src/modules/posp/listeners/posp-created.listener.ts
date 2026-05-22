import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PospCreatedEvent } from '../events/posp-created.event';

@EventsHandler(PospCreatedEvent)
export class PospCreatedListener implements IEventHandler<PospCreatedEvent> {
  private readonly logger = new Logger(PospCreatedListener.name);

  handle(event: PospCreatedEvent) {
    this.logger.log(
      `POSP created [id=${event.pospId}] [email=${event.email}] — welcome notification queued`,
    );
  }
}
