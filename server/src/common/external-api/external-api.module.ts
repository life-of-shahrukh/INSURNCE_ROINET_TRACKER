import { Module } from '@nestjs/common';
import { ExternalApiController } from './external-api.controller';
import { ExternalApiService } from './external-api.service';
import { HierarchyResolverService } from './hierarchy-resolver.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExternalApiController],
  providers: [ExternalApiService, HierarchyResolverService],
  exports: [ExternalApiService, HierarchyResolverService],
})
export class ExternalApiModule {}
