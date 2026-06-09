import { Module } from '@nestjs/common';
import { SalesTeamController } from './sales-team.controller';
import { SalesTeamService } from './sales-team.service';
import { SalesTeamRepository } from './sales-team.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalesTeamController],
  providers: [SalesTeamService, SalesTeamRepository],
  exports: [SalesTeamService, SalesTeamRepository],
})
export class SalesTeamModule {}
