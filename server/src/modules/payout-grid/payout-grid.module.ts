import { Module } from '@nestjs/common';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { PayoutGridService } from './payout-grid.service';
import { PayoutGridConfigService } from './payout-grid-config.service';
import { PayoutGridController } from './payout-grid.controller';
import { PayoutGridConfigController } from './payout-grid-config.controller';

@Module({
  imports: [ExternalApiModule],
  controllers: [PayoutGridController, PayoutGridConfigController],
  providers: [PayoutGridService, PayoutGridConfigService],
  exports: [PayoutGridService, PayoutGridConfigService],
})
export class PayoutGridModule {}
