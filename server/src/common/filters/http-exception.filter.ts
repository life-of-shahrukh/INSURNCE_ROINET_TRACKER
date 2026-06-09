import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx  = host.switchToHttp();
    const res  = ctx.getResponse<Response>();
    const req  = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const body   = exception.getResponse();

    const message =
      typeof body === 'string'
        ? body
        : (body as Record<string, unknown>).message ?? exception.message;

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    this.logger.error(exception);

    // Prisma validation errors → 400 Bad Request with the field message
    if (exception instanceof Prisma.PrismaClientValidationError) {
      // Extract the first meaningful line (skip stack preamble)
      const lines = exception.message.split('\n').map((l) => l.trim()).filter(Boolean);
      const detail = lines.find((l) => l.startsWith('Invalid value')) ?? lines[lines.length - 1] ?? 'Validation error';
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: detail,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Prisma known request errors (P2002 duplicate, P2025 not found, etc.)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        exception.code === 'P2025' ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      res.status(status).json({
        statusCode: status,
        message: `Database error [${exception.code}]: ${exception.message.split('\n')[0]}`,
        path: req.url,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
