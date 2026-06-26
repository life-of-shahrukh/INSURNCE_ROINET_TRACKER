import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Request } from 'express';
import type { Logger } from 'winston';
import { Observable, tap } from 'rxjs';

type AuthRequest = Request & {
  user?: { userId?: string; email?: string; role?: string };
};

/**
 * Logs every mutating request (POST/PATCH/DELETE) as an audit trail entry.
 * Combined with HttpLoggerInterceptor which logs ALL requests, this gives a
 * dedicated audit stream filterable in Grafana/Loki by label `log_type=audit`.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private static readonly MUTATING = new Set(['POST', 'PATCH', 'DELETE', 'PUT']);

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const { method, originalUrl } = req;

    if (!AuditLogInterceptor.MUTATING.has(method)) {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.info('AUDIT', {
            context: 'Audit',
            method,
            path: originalUrl,
            userId: req.user?.userId,
            role: req.user?.role,
            durationMs: Date.now() - start,
            result: 'success',
          });
        },
        error: () => {
          this.logger.warn('AUDIT failed', {
            context: 'Audit',
            method,
            path: originalUrl,
            userId: req.user?.userId,
            role: req.user?.role,
            durationMs: Date.now() - start,
            result: 'error',
          });
        },
      }),
    );
  }
}
