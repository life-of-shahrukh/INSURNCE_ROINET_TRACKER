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
import { DealListQueryDto } from './dto/deal-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

@Injectable()
export class DealService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  getAll(
    user: AuthUser,
    filters: DealListQueryDto,
    scope?: HierarchyScope,
  ): Promise<PaginatedResult<Deal>> {
    return this.queryBus.execute(
      new GetAllDealsQuery(filters, scope, user.pospId ?? undefined),
    );
  }

  create(dto: CreateDealDto, user: AuthUser): Promise<Deal> {
    const finalDto = { ...dto };
    finalDto.pospId = resolvePospScope(user, dto.pospId);
    return this.commandBus.execute(new CreateDealCommand(finalDto));
  }

  update(id: string, dto: UpdateDealDto, user: AuthUser): Promise<Deal> {
    const finalDto = { ...dto };
    // Only re-resolve pospId scope when the client is explicitly changing it.
    if (dto.pospId !== undefined) {
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

  exportCsv(
    user: AuthUser,
    filters: DealListQueryDto,
    scope?: HierarchyScope,
  ): Promise<string> {
    return this.queryBus.execute(
      new ExportDealsCsvQuery(filters, scope, user.pospId ?? undefined),
    );
  }
}
