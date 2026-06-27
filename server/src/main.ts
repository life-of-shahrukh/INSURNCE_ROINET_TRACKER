import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import type { Application, Request, Response } from 'express';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { HttpLoggerInterceptor } from './common/interceptors/http-logger.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  // Xpresso / Cognitensor SSO portal (makes browser-level requests during SSO handshake)
  'https://uat.xpresso.roinet.in',
  'https://xpresso.roinet.in',
  // Accept one or more comma-separated origins from env (set in ECS/docker-compose)
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : []),
];

async function bootstrap() {
  const allowedOrigins = ALLOWED_ORIGINS;

  const app = await NestFactory.create(AppModule, {
    // Suppress NestJS built-in logger; Winston takes over after init
    bufferLogs: true,
    cors: {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin "${origin}" is not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      optionsSuccessStatus: 200,
    },
  });

  // Replace NestJS's default logger with Winston globally
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Lightweight health endpoint
  const expressApp = app.getHttpAdapter().getInstance() as Application;
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global interceptors: logs every HTTP request + response with timing, and audit trail for mutations
  app.useGlobalInterceptors(app.get(HttpLoggerInterceptor), app.get(AuditLogInterceptor));

  // Global filters: structured error logging
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(WINSTON_MODULE_NEST_PROVIDER) as never),
    new HttpExceptionFilter(app.get(WINSTON_MODULE_NEST_PROVIDER) as never),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roinet CRM API')
    .setDescription(
      'REST API for POSP and Deals management — Roinet Insurance CRM',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('POSP', 'Point of Sales Person endpoints')
    .addTag('Deals', 'Deal management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 8000;
  await app.listen(port);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(`Server running on  http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs at    http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Allowed origins:   ${allowedOrigins.join(', ')}`, 'Bootstrap');
  logger.log(`Log dir:           ${process.env.LOG_DIR ?? 'logs'}`, 'Bootstrap');
}

bootstrap().catch(console.error);
