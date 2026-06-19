import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { OrgSyncService } from './org-sync.service';
import { OrgSyncController } from './org-sync.controller';
import { GeoModule } from '../geo/geo.module';

@Module({
  imports: [PrismaModule, ExternalApiModule, GeoModule],
  controllers: [OrgSyncController],
  providers: [OrgSyncService],
  exports: [OrgSyncService],
})
export class OrgSyncModule {}
