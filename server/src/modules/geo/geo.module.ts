import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { GeoCatalogService } from './geo-catalog.service';
import { GeoController } from './geo.controller';

@Module({
  imports: [ExternalApiModule],
  controllers: [GeoController],
  providers: [GeoCatalogService],
  exports: [GeoCatalogService],
})
export class GeoModule {}
