import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadCreatedEvent } from '../events/lead-created.event';
import { LeadStatusChangedEvent } from '../events/lead-status-changed.event';
import { LeadConvertedEvent } from '../events/lead-converted.event';

@Injectable()
export class LeadEventsListener {
  private readonly logger = new Logger(LeadEventsListener.name);

  @OnEvent('lead.created')
  handleLeadCreated(event: LeadCreatedEvent) {
    this.logger.log(
      `Lead created: ${event.leadId} for customer ${event.customerId} at ${event.occurredAt.toISOString()}`,
    );
  }

  @OnEvent('lead.status.changed')
  handleLeadStatusChanged(event: LeadStatusChangedEvent) {
    this.logger.log(
      `Lead ${event.leadId} status changed from ${event.previousStatus} to ${event.newStatus}`,
    );
  }

  @OnEvent('lead.converted')
  handleLeadConverted(event: LeadConvertedEvent) {
    this.logger.log(
      `Lead ${event.leadId} converted to deal ${event.dealId} at ${event.occurredAt.toISOString()}`,
    );
  }
}
