import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import type { UxEventBatchDto } from './dto/ux-event.dto';

const LOG_DIR = process.env.LOG_DIR ?? 'logs';

@Injectable()
export class TelemetryService {
  private readonly uxLogger: winston.Logger;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    // Dedicated Winston logger for UX events — separate from the app logger
    // so Promtail can scrape it independently with its own labels.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DRF = require('winston-daily-rotate-file') as new (
      o: Record<string, unknown>,
    ) => winston.transport;

    this.uxLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new DRF({
          dirname: LOG_DIR,
          filename: 'ux-events-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          maxSize: '50m',
          zippedArchive: true,
        }),
      ],
    });
  }

  ingestBatch(batch: UxEventBatchDto): void {
    const { identity, events } = batch;

    for (const event of events) {
      this.uxLogger.info({
        event_type: event.type,
        userId: identity.userId,
        role: identity.role,
        pospId: identity.pospId,
        page: event.page,
        target: event.target,
        targetText: event.targetText,
        clientTimestamp: event.timestamp,
        ...event.meta,
      });
    }

    this.logger.log?.(
      `Ingested ${events.length} UX events for user ${identity.userId}`,
      'TelemetryService',
    );
  }
}
