import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Request, Response } from 'express';
import type { Logger } from 'winston';
import { Observable, tap } from 'rxjs';

/**
 * Logs every HTTP request + response.
 * Fields logged:
 *   method, path, statusCode, durationMs, userId (if authenticated),
 *   ip, userAgent
 */
@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { user?: { userId?: string; email?: string } }>();
    const res = ctx.getResponse<Response>();
    const start = Date.now();

    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] ?? '';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.info('HTTP', {
            context: 'HTTP',
            method,
            path: originalUrl,
            statusCode: res.statusCode,
            durationMs: ms,
            userId: req.user?.userId,
            ip,
            userAgent,
          });
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const status =
            typeof err === 'object' && err !== null && 'status' in err
              ? (err as { status: number }).status
              : 500;
          this.logger.warn('HTTP error', {
            context: 'HTTP',
            method,
            path: originalUrl,
            statusCode: status,
            durationMs: ms,
            userId: req.user?.userId,
            ip,
            // error message attached by exception filter
          });
        },
      }),
    );
  }
}
