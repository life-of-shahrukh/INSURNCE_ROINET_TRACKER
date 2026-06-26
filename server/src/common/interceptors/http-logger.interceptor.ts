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

/** Requests slower than this are flagged as slow. */
const SLOW_REQUEST_MS = 1000;

/** Paths to skip (heartbeat/health checks pollute logs). */
const SKIP_PATHS = new Set(['/health', '/api/docs', '/favicon.ico']);

type AuthRequest = Request & {
  user?: { userId?: string; email?: string; role?: string };
};

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<AuthRequest>();
    const res = ctx.getResponse<Response>();
    const start = Date.now();

    const { method, originalUrl, ip } = req;
    const path = originalUrl.split('?')[0];

    if (SKIP_PATHS.has(path)) {
      return next.handle();
    }

    const contentLength = req.headers['content-length'];
    const reqBodyBytes = contentLength ? parseInt(contentLength, 10) : 0;
    const userAgent = req.headers['user-agent'] ?? '';
    const referer = req.headers['referer'] ?? '';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const slow = ms >= SLOW_REQUEST_MS;

          this.logger.log(slow ? 'warn' : 'info', 'HTTP', {
            context: 'HTTP',
            method,
            path: originalUrl,
            statusCode: res.statusCode,
            durationMs: ms,
            slow,
            reqBodyBytes,
            userId: req.user?.userId,
            role: req.user?.role,
            ip,
            userAgent,
            referer: referer || undefined,
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
            role: req.user?.role,
            ip,
          });
        },
      }),
    );
  }
}
