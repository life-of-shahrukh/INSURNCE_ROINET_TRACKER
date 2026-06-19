import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { GeoCatalogService } from './geo-catalog.service';
import { GeoController } from './geo.controller';

@Module({
  imports: [ExternalApiModule, PrismaModule],
  controllers: [GeoController],
  providers: [GeoCatalogService],
  exports: [GeoCatalogService],
})
export class GeoModule {}
