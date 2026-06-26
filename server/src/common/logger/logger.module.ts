import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const LOG_DIR = process.env.LOG_DIR ?? 'logs';
const isProd = process.env.NODE_ENV === 'production';

// JSON format for file transports (ingestion-friendly)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Human-readable colorized format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    ({ timestamp: ts, level, message, context, trace, ...meta }) => {
      const ctx = context ? `[${String(context)}] ` : '';
      const extra =
        Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
      const stack = trace ? `\n${String(trace)}` : '';
      return `${String(ts)} ${level} ${ctx}${String(message)}${extra}${stack}`;
    },
  ),
);

// Typed helper to create DailyRotateFile (winston types don't expose it directly)
type DailyRotateFileOpts = {
  level: string;
  dirname: string;
  filename: string;
  datePattern: string;
  maxFiles: string;
  maxSize: string;
  zippedArchive: boolean;
  format: winston.Logform.Format;
};

function dailyFile(opts: DailyRotateFileOpts): winston.transport {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DRF = require('winston-daily-rotate-file') as new (
    o: DailyRotateFileOpts,
  ) => winston.transport;
  return new DRF(opts);
}

/**
 * Global logger module.
 * Import ONCE in AppModule — the WINSTON_MODULE_PROVIDER token is then
 * available everywhere for injection.
 */
@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: isProd ? 'info' : 'debug',
      transports: [
        new winston.transports.Console({
          level: isProd ? 'info' : 'debug',
          format: consoleFormat,
        }),
        // All logs (≥ info) — rotated daily, kept 14 days
        dailyFile({
          level: 'info',
          dirname: LOG_DIR,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          maxSize: '20m',
          zippedArchive: true,
          format: fileFormat,
        }),
        // Error-only file — kept 30 days for auditing
        dailyFile({
          level: 'error',
          dirname: LOG_DIR,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
          maxSize: '20m',
          zippedArchive: true,
          format: fileFormat,
        }),
      ],
      exitOnError: false,
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
