import { Module } from '@nestjs/common';
import { HierarchyController } from './hierarchy.controller';
import { HierarchyService } from './hierarchy.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';

@Module({
  imports: [PrismaModule, ExternalApiModule],
  controllers: [HierarchyController],
  providers: [HierarchyService, HierarchyScopeInterceptor],
  exports: [HierarchyService],
})
export class HierarchyModule {}
