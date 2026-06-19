import { Module } from '@nestjs/common';
import { SalesTeamController } from './sales-team.controller';
import { SalesTeamService } from './sales-team.service';
import { SalesTeamRepository } from './sales-team.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { OrgSyncModule } from '../org-sync/org-sync.module';

@Module({
  imports: [PrismaModule, ExternalApiModule, OrgSyncModule],
  controllers: [SalesTeamController],
  providers: [SalesTeamService, SalesTeamRepository],
  exports: [SalesTeamService, SalesTeamRepository],
})
export class SalesTeamModule {}
