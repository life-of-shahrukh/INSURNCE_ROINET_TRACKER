import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadCommand } from './commands/create-lead.command';
import { UpdateLeadCommand } from './commands/update-lead.command';
import { ConvertLeadToDealCommand } from './commands/convert-lead-to-deal.command';
import { GetAllLeadsQuery } from './queries/get-all-leads.query';
import { GetMonthlyCommitmentQuery } from './queries/get-monthly-commitment.query';
import { Lead } from '@prisma/client';
import { LeadListQueryDto } from './dto/lead-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

@Injectable()
export class LeadService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    return this.commandBus.execute(new CreateLeadCommand(dto));
  }

  async findAll(
    filters: LeadListQueryDto,
    scope?: HierarchyScope,
  ): Promise<PaginatedResult<Lead>> {
    return this.queryBus.execute(new GetAllLeadsQuery(filters, scope));
  }

  async getMonthlyCommitment(): Promise<{ total: number; count: number }> {
    return this.queryBus.execute(new GetMonthlyCommitmentQuery());
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    return this.commandBus.execute(new UpdateLeadCommand(id, dto));
  }

  async convertToDeal(leadId: string): Promise<{ dealId: string }> {
    return this.commandBus.execute(new ConvertLeadToDealCommand(leadId));
  }
}
