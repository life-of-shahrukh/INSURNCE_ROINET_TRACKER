import { Injectable, Inject } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
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
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(dto: CreateLeadDto, user: AuthUser): Promise<Lead> {
    const pospId = resolvePospScope(user, undefined);
    this.logger.info('Creating lead', {
      context: 'LeadService',
      userId: user.userId,
      pospId,
      customerId: dto.customerId,
      product: dto.productSubType,
    });
    const lead = await this.commandBus.execute<CreateLeadCommand, Lead>(
      new CreateLeadCommand(dto, user.userId, pospId),
    );
    this.logger.info('Lead created', {
      context: 'LeadService',
      leadId: lead.id,
      userId: user.userId,
    });
    return lead;
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
    this.logger.info('Updating lead', {
      context: 'LeadService',
      leadId: id,
      userId: user.userId,
      fields: Object.keys(dto),
    });
    const lead = await this.commandBus.execute<UpdateLeadCommand, Lead>(
      new UpdateLeadCommand(id, dto, user, scope),
    );
    this.logger.info('Lead updated', {
      context: 'LeadService',
      leadId: id,
      status: (lead as Lead & { status?: string }).status,
    });
    return lead;
  }

  async convertToDeal(
    leadId: string,
    user: AuthUser,
    policyNo: string,
    scope?: HierarchyScope,
  ): Promise<{ dealId: string }> {
    this.logger.info('Converting lead to deal', {
      context: 'LeadService',
      leadId,
      userId: user.userId,
      policyNo,
    });
    const result = await this.commandBus.execute<ConvertLeadToDealCommand, { dealId: string }>(
      new ConvertLeadToDealCommand(leadId, user, policyNo, scope),
    );
    this.logger.info('Lead converted to deal', {
      context: 'LeadService',
      leadId,
      dealId: result.dealId,
    });
    return result;
  }

  async delete(id: string, scope?: HierarchyScope): Promise<void> {
    this.logger.warn('Deleting lead', { context: 'LeadService', leadId: id });
    await this.commandBus.execute(new DeleteLeadCommand(id, scope));
    this.logger.info('Lead deleted', { context: 'LeadService', leadId: id });
  }

  exportCsv(
    filters: LeadListQueryDto,
    scope?: HierarchyScope,
  ): Promise<string> {
    this.logger.info('Exporting leads CSV', { context: 'LeadService' });
    return this.queryBus.execute(new ExportLeadsCsvQuery(filters, scope));
  }
}
