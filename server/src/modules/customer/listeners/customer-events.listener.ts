import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CustomerCreatedEvent } from '../events/customer-created.event';

@Injectable()
export class CustomerEventsListener {
  private readonly logger = new Logger(CustomerEventsListener.name);

  @OnEvent('customer.created')
  handleCustomerCreated(event: CustomerCreatedEvent) {
    this.logger.log(
      `Customer created: ${event.customerId} (${event.email || 'no email'}) at ${event.occurredAt}`,
    );
  }
}
