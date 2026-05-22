import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealCommand } from './commands/create-deal.command';
import { UpdateDealCommand } from './commands/update-deal.command';
import { DeleteDealCommand } from './commands/delete-deal.command';
import { GetAllDealsQuery } from './queries/get-all-deals.query';
import { DealRepository } from './deal.repository';
import { Deal } from '@prisma/client';

@Injectable()
export class DealService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly dealRepo: DealRepository,
  ) {}

  getAll(): Promise<Deal[]> {
    return this.queryBus.execute(new GetAllDealsQuery());
  }

  create(dto: CreateDealDto): Promise<Deal> {
    return this.commandBus.execute(new CreateDealCommand(dto));
  }

  update(id: string, dto: UpdateDealDto): Promise<Deal> {
    return this.commandBus.execute(new UpdateDealCommand(id, dto));
  }

  delete(id: string): Promise<void> {
    return this.commandBus.execute(new DeleteDealCommand(id));
  }

  exportCsv(): Promise<string> {
    return this.dealRepo.exportCsv();
  }
}
