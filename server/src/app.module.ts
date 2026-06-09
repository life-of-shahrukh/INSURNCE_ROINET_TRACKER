import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './prisma/prisma.module';
import { PospModule } from './modules/posp/posp.module';
import { DealModule } from './modules/deal/deal.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { LeadModule } from './modules/lead/lead.module';
import { SalesTeamModule } from './modules/sales-team/sales-team.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CqrsModule.forRoot(),
    PrismaModule,
    AuthModule,
    PospModule,
    DealModule,
    CustomerModule,
    LeadModule,
    SalesTeamModule,
  ],
})
export class AppModule {}
