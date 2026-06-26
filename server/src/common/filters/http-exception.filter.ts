import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

// ─── helpers ────────────────────────────────────────────────────────────────

function errorMeta(req: Request, statusCode: number) {
  return {
    context: 'ExceptionFilter',
    method: req.method,
    path: req.url,
    statusCode,
    ip: req.ip,
  };
}

// ─── Http (4xx / known NestJS) ───────────────────────────────────────────────

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger | null,
  ) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const message =
      typeof body === 'string'
        ? body
        : ((body as Record<string, unknown>).message ?? exception.message);

    // Log 4xx as warn, 5xx+ as error
    const logLevel = status >= 500 ? 'error' : 'warn';
    (this.logger ?? console)[logLevel](`HttpException: ${String(message)}`, {
      ...errorMeta(req, status),
      trace: status >= 500 ? exception.stack : undefined,
    });

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}

// ─── All other (5xx / Prisma / unexpected) ───────────────────────────────────

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger | null,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // ── Prisma validation error → 400 ─────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientValidationError) {
      const lines = exception.message
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const detail =
        lines.find((l) => l.startsWith('Invalid value')) ??
        lines[lines.length - 1] ??
        'Validation error';

      (this.logger ?? console).warn(
        `PrismaValidationError: ${detail}`,
        errorMeta(req, HttpStatus.BAD_REQUEST),
      );

      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: detail,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── Prisma known request error (P2002 duplicate, P2025 not found…) ────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        exception.code === 'P2025'
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      const message = `Database error [${exception.code}]: ${exception.message.split('\n')[0]}`;

      (this.logger ?? console).warn(`PrismaKnownError: ${message}`, {
        ...errorMeta(req, status),
        prismaCode: exception.code,
      });

      res.status(status).json({
        statusCode: status,
        message,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // ── Unknown / unexpected 500 ───────────────────────────────────────────
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const trace =
      exception instanceof Error ? exception.stack : String(exception);

    (this.logger ?? console).error(`UnhandledException: ${message}`, {
      ...errorMeta(req, status),
      trace,
    });

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
