import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { CreateDealCommand } from './commands/create-deal.command';
import { UpdateDealCommand } from './commands/update-deal.command';
import { DeleteDealCommand } from './commands/delete-deal.command';
import { GetAllDealsQuery } from './queries/get-all-deals.query';
import { DealRepository } from './deal.repository';
import { Deal, Role } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';

@Injectable()
export class DealService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly dealRepo: DealRepository,
  ) {}

  getAll(user: AuthUser): Promise<Deal[]> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      return this.dealRepo.findAllByPospId(user.pospId);
    }
    return this.queryBus.execute(new GetAllDealsQuery());
  }

  create(dto: CreateDealDto, user: AuthUser): Promise<Deal> {
    if (user.role === Role.POSP) {
      const pospId = resolvePospScope(user, dto.pospId);
      return this.dealRepo.createForPosp(pospId, dto);
    }
    return this.commandBus.execute(new CreateDealCommand(dto));
  }

  update(id: string, dto: UpdateDealDto, user: AuthUser): Promise<Deal> {
    if (user.role === Role.POSP) {
      const pospId = resolvePospScope(user, dto.pospId);
      return this.dealRepo.updateByPosp(id, pospId, dto);
    }
    return this.commandBus.execute(new UpdateDealCommand(id, dto));
  }

  async delete(id: string, user: AuthUser): Promise<void> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      await this.dealRepo.deleteByPosp(id, user.pospId);
      return;
    }
    return this.commandBus.execute(new DeleteDealCommand(id));
  }

  exportCsv(user: AuthUser): Promise<string> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      return this.dealRepo.exportCsvByPosp(user.pospId);
    }
    return this.dealRepo.exportCsv();
  }
}
