import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { DealRepository } from './deal.repository';
import { CreateDealHandler } from './commands/create-deal.handler';
import { UpdateDealHandler } from './commands/update-deal.handler';
import { DeleteDealHandler } from './commands/delete-deal.handler';
import { GetAllDealsHandler } from './queries/get-all-deals.handler';
import { ExportDealsCsvHandler } from './queries/export-deals-csv.handler';
import {
  DealCreatedListener,
  DealStatusChangedListener,
} from './listeners/deal-events.listener';

const CommandHandlers = [
  CreateDealHandler,
  UpdateDealHandler,
  DeleteDealHandler,
];
const QueryHandlers = [GetAllDealsHandler, ExportDealsCsvHandler];
const EventListeners = [DealCreatedListener, DealStatusChangedListener];

@Module({
  imports: [CqrsModule],
  controllers: [DealController],
  providers: [
    DealService,
    DealRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,
  ],
})
export class DealModule {}
