import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatusChangedEvent } from '../events/deal-status-changed.event';
import { PrismaService } from '../../../prisma/prisma.service';

@EventsHandler(DealCreatedEvent)
export class DealCreatedListener implements IEventHandler<DealCreatedEvent> {
  private readonly logger = new Logger(DealCreatedListener.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: DealCreatedEvent): Promise<void> {
    this.logger.log(
      `Deal created [id=${event.dealId}] [pospId=${event.pospId}] [status=${event.status}]`,
    );

    if (!event.pospId) return;

    await this.prisma.posp.update({
      where: { id: event.pospId },
      data: {
        lastBusinessAt: event.occurredAt,
        active: true,
        autoInactive: false,
      },
    });
  }
}

@EventsHandler(DealStatusChangedEvent)
export class DealStatusChangedListener implements IEventHandler<DealStatusChangedEvent> {
  private readonly logger = new Logger(DealStatusChangedListener.name);

  handle(event: DealStatusChangedEvent): void {
    this.logger.log(
      `Deal status changed [id=${event.dealId}] [${event.previousStatus} → ${event.newStatus}]`,
    );
  }
}
