import {
  Injectable,
  Inject,
  Optional,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';

/** Log any DB query that takes longer than this threshold. */
const SLOW_QUERY_MS = 500;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Optional()
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger | null,
  ) {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Slow-query detector
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as unknown as any).$on('query', (e: { query: string; params: string; duration: number; target: string }) => {
      if (e.duration >= SLOW_QUERY_MS) {
        (this.logger ?? console).warn('Slow DB query', {
          context: 'PrismaService',
          durationMs: e.duration,
          query: e.query,
          params: e.params,
          target: e.target,
        });
      }
    });

    // DB-level errors (separate from Prisma client errors caught in filters)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as unknown as any).$on('error', (e: { message: string; target: string }) => {
      (this.logger ?? console).error('Prisma DB error', {
        context: 'PrismaService',
        message: e.message,
        target: e.target,
      });
    });

    // DB-level warnings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as unknown as any).$on('warn', (e: { message: string; target: string }) => {
      (this.logger ?? console).warn('Prisma DB warning', {
        context: 'PrismaService',
        message: e.message,
        target: e.target,
      });
    });
  }

  async onModuleInit(): Promise<void> {
    let attempt = 0;
    while (attempt < 3) {
      try {
        await this.$connect();
        (this.logger ?? console).info?.('Database connected', {
          context: 'PrismaService',
        });
        return;
      } catch (err) {
        attempt++;
        (this.logger ?? console).warn(`DB connect attempt ${attempt} failed: ${(err as Error).message}`, {
          context: 'PrismaService',
          attempt,
        });
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    (this.logger ?? console).info?.('Database disconnecting', {
      context: 'PrismaService',
    });
    await this.$disconnect();
  }
}
