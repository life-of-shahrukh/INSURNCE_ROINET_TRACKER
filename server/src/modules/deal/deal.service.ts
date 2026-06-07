import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealCommand } from './commands/create-deal.command';
import { UpdateDealCommand } from './commands/update-deal.command';
import { DeleteDealCommand } from './commands/delete-deal.command';
import { GetAllDealsQuery } from './queries/get-all-deals.query';
import { ExportDealsCsvQuery } from './queries/export-deals-csv.query';
import { Deal } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';

@Injectable()
export class DealService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getAll(user: AuthUser): Promise<Deal[]> {
    const pospId = user.pospId ?? undefined;
    return this.queryBus.execute(new GetAllDealsQuery(pospId));
  }

  create(dto: CreateDealDto, user: AuthUser): Promise<Deal> {
    const finalDto = { ...dto };
    if (user.pospId) {
      finalDto.pospId = resolvePospScope(user, dto.pospId);
    }
    return this.commandBus.execute(new CreateDealCommand(finalDto));
  }

  update(id: string, dto: UpdateDealDto, user: AuthUser): Promise<Deal> {
    const finalDto = { ...dto };
    if (user.pospId) {
      finalDto.pospId = resolvePospScope(user, dto.pospId);
    }
    return this.commandBus.execute(new UpdateDealCommand(id, finalDto));
  }

  async delete(id: string, user: AuthUser): Promise<void> {
    if (!user.pospId && !user.userId) {
      throw new ForbiddenException('Unauthorized');
    }
    return this.commandBus.execute(new DeleteDealCommand(id, user.pospId));
  }

  exportCsv(user: AuthUser): Promise<string> {
    const pospId = user.pospId ?? undefined;
    return this.queryBus.execute(new ExportDealsCsvQuery(pospId));
  }
}
