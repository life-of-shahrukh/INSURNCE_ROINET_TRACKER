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
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { Role } from '../../common/constants';

/**
 * COA, COA mode, and Retained Margin are financial fields only SUPER_ADMIN may set.
 * Stripping them server-side is the real gate — the UI lock alone is insufficient.
 * On create the omitted fields fall back to repository defaults; on update the
 * existing persisted values are preserved (repository only writes provided keys).
 */
function stripFinancials(dto: {
  coa?: number;
  coaType?: string;
  margin?: number;
}): void {
  delete dto.coa;
  delete dto.coaType;
  delete dto.margin;
}

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
    if (user.role === Role.POSP) {
      throw new BadRequestException(
        'Create a lead first; add a policy number on edit to convert to a deal.',
      );
    }
    const finalDto = { ...dto };
    finalDto.pospId = resolvePospScope(user, dto.pospId);
    if (user.role !== Role.SUPER_ADMIN) {
      stripFinancials(finalDto);
    }
    return this.commandBus.execute(
      new CreateDealCommand(finalDto, user.userId),
    );
  }

  update(
    id: string,
    dto: UpdateDealDto,
    user: AuthUser,
    scope?: HierarchyScope,
  ): Promise<Deal> {
    const finalDto = { ...dto };
    // Only re-resolve pospId scope when the client is explicitly changing it.
    if (dto.pospId !== undefined) {
      finalDto.pospId = resolvePospScope(user, dto.pospId);
    }
    if (user.role !== Role.SUPER_ADMIN) {
      stripFinancials(finalDto);
    }
    return this.commandBus.execute(new UpdateDealCommand(id, finalDto, scope));
  }

  async delete(
    id: string,
    user: AuthUser,
    scope?: HierarchyScope,
  ): Promise<void> {
    if (!user.pospId && !user.userId) {
      throw new ForbiddenException('Unauthorized');
    }
    const pospId = user.role === Role.POSP ? user.pospId : undefined;
    return this.commandBus.execute(new DeleteDealCommand(id, pospId, scope));
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
