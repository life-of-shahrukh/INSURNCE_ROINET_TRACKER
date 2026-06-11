import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PospController } from './posp.controller';
import { PospService } from './posp.service';
import { PospRepository } from './posp.repository';
import { CreatePospHandler } from './commands/create-posp.handler';
import { UpdatePospHandler } from './commands/update-posp.handler';
import { GetAllPospHandler } from './queries/get-all-posp.handler';
import { GetPospByIdHandler } from './queries/get-posp-by-id.handler';
import { PospCreatedListener } from './listeners/posp-created.listener';

const CommandHandlers = [CreatePospHandler, UpdatePospHandler];
const QueryHandlers = [GetAllPospHandler, GetPospByIdHandler];
const EventListeners = [PospCreatedListener];

@Module({
  imports: [CqrsModule],
  controllers: [PospController],
  providers: [
    PospService,
    PospRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,
  ],
})
export class PospModule {}
