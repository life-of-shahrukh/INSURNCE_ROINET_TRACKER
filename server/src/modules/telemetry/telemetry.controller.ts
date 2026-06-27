import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { UxEventBatchDto } from './dto/ux-event.dto';

@Controller('api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post('events')
  @HttpCode(HttpStatus.NO_CONTENT)
  ingestEvents(@Body() batch: UxEventBatchDto): void {
    this.telemetryService.ingestBatch(batch);
  }
}
