import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './prisma/prisma.module';
import { PospModule } from './modules/posp/posp.module';
import { DealModule } from './modules/deal/deal.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { LeadModule } from './modules/lead/lead.module';
import { SalesTeamModule } from './modules/sales-team/sales-team.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExternalApiModule } from './common/external-api/external-api.module';
import { ProfileModule } from './modules/profile/profile.module';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module';
import { SsoModule } from './modules/sso/sso.module';
import { OrgSyncModule } from './modules/org-sync/org-sync.module';
import { GeoModule } from './modules/geo/geo.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CqrsModule.forRoot(),
    PrismaModule,
    AuthModule,
    SsoModule,
    PospModule,
    DealModule,
    CustomerModule,
    LeadModule,
    SalesTeamModule,
    DashboardModule,
    ExternalApiModule,
    ProfileModule,
    HierarchyModule,
    OrgSyncModule,
    GeoModule,
  ],
})
export class AppModule {}
