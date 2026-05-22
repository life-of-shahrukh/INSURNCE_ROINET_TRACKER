import { ForbiddenException, Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { CreatePospCommand } from './commands/create-posp.command';
import { UpdatePospCommand } from './commands/update-posp.command';
import { GetAllPospQuery } from './queries/get-all-posp.query';
import { Posp, Role } from '@prisma/client';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { PospRepository } from './posp.repository';
import { resolvePospScope } from '../../common/auth/posp-scope.util';

@Injectable()
export class PospService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly pospRepo: PospRepository,
  ) {}

  async getAll(user: AuthUser): Promise<Posp[]> {
    if (user.role === Role.POSP) {
      if (!user.pospId) {
        throw new ForbiddenException('POSP account is not linked');
      }
      return [await this.pospRepo.findById(user.pospId)];
    }
    return this.queryBus.execute(new GetAllPospQuery());
  }

  create(dto: CreatePospDto, user: AuthUser): Promise<Posp> {
    if (user.role === Role.POSP) {
      throw new ForbiddenException('POSP users cannot create POSP records');
    }
    return this.commandBus.execute(new CreatePospCommand(dto));
  }

  update(id: string, dto: UpdatePospDto, user: AuthUser): Promise<Posp> {
    if (user.role === Role.POSP) {
      return this.pospRepo.update(resolvePospScope(user, id), dto);
    }
    return this.commandBus.execute(new UpdatePospCommand(id, dto));
  }
}
