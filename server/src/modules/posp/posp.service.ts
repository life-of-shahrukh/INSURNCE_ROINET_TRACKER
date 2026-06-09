import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { CreatePospCommand } from './commands/create-posp.command';
import { UpdatePospCommand } from './commands/update-posp.command';
import { GetAllPospQuery } from './queries/get-all-posp.query';
import { GetPospByIdQuery } from './queries/get-posp-by-id.query';
import { Posp } from '@prisma/client';
import { Role } from '../../common/constants';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { resolvePospScope } from '../../common/auth/posp-scope.util';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

@Injectable()
export class PospService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async getAll(user: AuthUser, scope?: HierarchyScope): Promise<Posp[]> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      const posp = await this.queryBus.execute(new GetPospByIdQuery(user.pospId));
      return [posp];
    }
    return this.queryBus.execute(new GetAllPospQuery(scope));
  }

  create(dto: CreatePospDto, user: AuthUser): Promise<Posp> {
    if (user.role === Role.POSP) {
      throw new ForbiddenException('POSP users cannot create POSP records');
    }
    return this.commandBus.execute(new CreatePospCommand(dto));
  }

  update(id: string, dto: UpdatePospDto, user: AuthUser): Promise<Posp> {
    const finalId = user.pospId ? resolvePospScope(user, id) : id;
    return this.commandBus.execute(new UpdatePospCommand(finalId, dto));
  }
}
