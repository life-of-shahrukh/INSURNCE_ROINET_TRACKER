import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { CreatePospCommand } from './commands/create-posp.command';
import { UpdatePospCommand } from './commands/update-posp.command';
import { GetAllPospQuery } from './queries/get-all-posp.query';
import { Posp } from '@prisma/client';

@Injectable()
export class PospService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getAll(): Promise<Posp[]> {
    return this.queryBus.execute(new GetAllPospQuery());
  }

  create(dto: CreatePospDto): Promise<Posp> {
    return this.commandBus.execute(new CreatePospCommand(dto));
  }

  update(id: string, dto: UpdatePospDto): Promise<Posp> {
    return this.commandBus.execute(new UpdatePospCommand(id, dto));
  }
}
