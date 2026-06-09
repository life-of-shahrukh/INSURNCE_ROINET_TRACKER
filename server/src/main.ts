import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters/http-exception.filter';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

async function bootstrap() {
  const allowedOrigins = ALLOWED_ORIGINS;

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow server-to-server / Postman / Swagger (no Origin header)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: origin "${origin}" is not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,         // required for HttpOnly cookie to be sent cross-origin
      optionsSuccessStatus: 200, // IE11 compatibility
    },
  });

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),  // outermost — catches everything not caught below
    new HttpExceptionFilter(),  // innermost — handles NestJS HttpExceptions specifically
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Roinet CRM API')
    .setDescription('REST API for POSP and Deals management — Roinet Insurance CRM')
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
  console.log(`Server running on  http://localhost:${port}`);
  console.log(`Swagger docs at    http://localhost:${port}/api/docs`);
  console.log(`Allowed origins:   ${allowedOrigins.join(', ')}`);
}

bootstrap();
