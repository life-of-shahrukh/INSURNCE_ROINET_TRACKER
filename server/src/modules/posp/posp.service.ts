import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { CreatePospCommand } from './commands/create-posp.command';
import { UpdatePospCommand } from './commands/update-posp.command';
import { GetAllPospQuery } from './queries/get-all-posp.query';
import { GetPospByIdQuery } from './queries/get-posp-by-id.query';
import { ExportPospCsvQuery } from './queries/export-posp-csv.query';
import { Posp } from '@prisma/client';
import { PospListQueryDto } from './dto/posp-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { Role } from '../../common/constants';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';
import {
  districtIdsForCode,
  scopeDistrictIds,
  type HierarchyScope,
} from '../../common/auth/hierarchy-scope.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PospService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  async getAll(
    user: AuthUser,
    filters: PospListQueryDto,
    scope?: HierarchyScope,
  ): Promise<PaginatedResult<Posp>> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      const posp = (await this.queryBus.execute(
        new GetPospByIdQuery(user.pospId),
      )) as unknown as Posp;
      return buildPaginatedResult([posp], 1, 1, 1);
    }
    const effectiveScope = await this.applyManagerFilter(filters, scope);
    return this.queryBus.execute(new GetAllPospQuery(filters, effectiveScope));
  }

  /**
   * If the caller filters by a specific manager code, narrow the scope to the
   * districts that manager covers — always intersected with the caller's own
   * territory so the filter can never widen access. The org graph is
   * role-agnostic, so any of the dm/asm/rh code filters resolves the same way.
   */
  private async applyManagerFilter(
    filters: PospListQueryDto,
    scope?: HierarchyScope,
  ): Promise<HierarchyScope | undefined> {
    const managerCode = filters.dmCode ?? filters.asmCode ?? filters.rhCode;
    if (!managerCode) return scope;

    let districtIds = await districtIdsForCode(this.prisma, managerCode);
    const callerDistricts = scope ? scopeDistrictIds(scope) : null;
    if (callerDistricts !== null) {
      const allowed = new Set(callerDistricts);
      districtIds = districtIds.filter((id) => allowed.has(id));
    }
    return { districtIds };
  }

  create(dto: CreatePospDto, user: AuthUser): Promise<Posp> {
    if (user.role === Role.POSP) {
      throw new ForbiddenException('POSP users cannot create POSP records');
    }
    return this.commandBus.execute(new CreatePospCommand(dto));
  }

  update(id: string, dto: UpdatePospDto, user: AuthUser): Promise<Posp> {
    const finalId = user.pospId ? (resolvePospScope(user, id) ?? id) : id;
    return this.commandBus.execute(new UpdatePospCommand(finalId, dto));
  }

  exportCsv(
    filters: PospListQueryDto,
    scope?: HierarchyScope,
  ): Promise<string> {
    return this.queryBus.execute(new ExportPospCsvQuery(filters, scope));
  }
}
