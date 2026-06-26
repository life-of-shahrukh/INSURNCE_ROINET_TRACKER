import { Injectable, Inject } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
      this.logger.warn('Deal create blocked: POSP attempted direct creation', {
        context: 'DealService',
        userId: user.userId,
      });
      throw new BadRequestException(
        'Create a lead first; add a policy number on edit to convert to a deal.',
      );
    }
    const finalDto = { ...dto };
    finalDto.pospId = resolvePospScope(user, dto.pospId);
    if (user.role !== Role.SUPER_ADMIN) {
      stripFinancials(finalDto);
    }
    this.logger.info('Creating deal', {
      context: 'DealService',
      userId: user.userId,
      role: user.role,
      pospId: finalDto.pospId,
    });
    return this.commandBus.execute(new CreateDealCommand(finalDto, user.userId));
  }

  async update(
    id: string,
    dto: UpdateDealDto,
    user: AuthUser,
    scope?: HierarchyScope,
  ): Promise<Deal> {
    const finalDto = { ...dto };
    if (dto.pospId !== undefined) {
      finalDto.pospId = resolvePospScope(user, dto.pospId);
    }
    if (user.role !== Role.SUPER_ADMIN) {
      stripFinancials(finalDto);
    }
    this.logger.info('Updating deal', {
      context: 'DealService',
      dealId: id,
      userId: user.userId,
      role: user.role,
      fields: Object.keys(dto),
    });
    const deal = await this.commandBus.execute<UpdateDealCommand, Deal>(
      new UpdateDealCommand(id, finalDto, scope),
    );
    this.logger.info('Deal updated', {
      context: 'DealService',
      dealId: id,
      status: (deal as Deal & { status?: string }).status,
    });
    return deal;
  }

  async delete(
    id: string,
    user: AuthUser,
    scope?: HierarchyScope,
  ): Promise<void> {
    if (!user.pospId && !user.userId) {
      this.logger.warn('Deal delete blocked: missing identity', {
        context: 'DealService',
        dealId: id,
      });
      throw new ForbiddenException('Unauthorized');
    }
    this.logger.warn('Deleting deal', {
      context: 'DealService',
      dealId: id,
      userId: user.userId,
      role: user.role,
    });
    const pospId = user.role === Role.POSP ? user.pospId : undefined;
    await this.commandBus.execute(new DeleteDealCommand(id, pospId, scope));
    this.logger.info('Deal deleted', { context: 'DealService', dealId: id });
  }

  exportCsv(
    user: AuthUser,
    filters: DealListQueryDto,
    scope?: HierarchyScope,
  ): Promise<string> {
    this.logger.info('Exporting deals CSV', {
      context: 'DealService',
      userId: user.userId,
    });
    return this.queryBus.execute(
      new ExportDealsCsvQuery(filters, scope, user.pospId ?? undefined),
    );
  }
}
