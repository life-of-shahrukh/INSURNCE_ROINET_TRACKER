import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadCommand } from './commands/create-lead.command';
import { UpdateLeadCommand } from './commands/update-lead.command';
import { ConvertLeadToDealCommand } from './commands/convert-lead-to-deal.command';
import { DeleteLeadCommand } from './commands/delete-lead.command';
import { GetAllLeadsQuery } from './queries/get-all-leads.query';
import { GetMonthlyCommitmentQuery } from './queries/get-monthly-commitment.query';
import { ExportLeadsCsvQuery } from './queries/export-leads-csv.query';
import { Lead } from '@prisma/client';
import { LeadListQueryDto } from './dto/lead-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';

@Injectable()
export class LeadService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(dto: CreateLeadDto, user: AuthUser): Promise<Lead> {
    const pospId = resolvePospScope(user, undefined);
    return this.commandBus.execute(
      new CreateLeadCommand(dto, user.userId, pospId),
    );
  }

  async findAll(
    filters: LeadListQueryDto,
    scope?: HierarchyScope,
  ): Promise<PaginatedResult<Lead>> {
    return this.queryBus.execute(new GetAllLeadsQuery(filters, scope));
  }

  async getMonthlyCommitment(
    scope?: HierarchyScope,
  ): Promise<{ total: number; count: number }> {
    return this.queryBus.execute(new GetMonthlyCommitmentQuery(scope));
  }

  async update(
    id: string,
    dto: UpdateLeadDto,
    user: AuthUser,
    scope?: HierarchyScope,
  ): Promise<Lead> {
    return this.commandBus.execute(new UpdateLeadCommand(id, dto, user, scope));
  }

  async convertToDeal(
    leadId: string,
    user: AuthUser,
    policyNo: string,
    scope?: HierarchyScope,
  ): Promise<{ dealId: string }> {
    return this.commandBus.execute(
      new ConvertLeadToDealCommand(leadId, user, policyNo, scope),
    );
  }

  async delete(id: string, scope?: HierarchyScope): Promise<void> {
    return this.commandBus.execute(new DeleteLeadCommand(id, scope));
  }

  exportCsv(
    filters: LeadListQueryDto,
    scope?: HierarchyScope,
  ): Promise<string> {
    return this.queryBus.execute(new ExportLeadsCsvQuery(filters, scope));
  }
}
