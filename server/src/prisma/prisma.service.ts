import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          // Append generous timeouts so Neon auto-suspend wakeup never times out
          url: (() => {
            const base = process.env.DATABASE_URL ?? '';
            const url = new URL(base);
            if (!url.searchParams.has('connect_timeout'))
              url.searchParams.set('connect_timeout', '30');
            if (!url.searchParams.has('pool_timeout'))
              url.searchParams.set('pool_timeout', '30');
            return url.toString();
          })(),
        },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    // Retry connect up to 3 times — gives Neon time to wake from auto-suspend
    let attempt = 0;
    while (attempt < 3) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        attempt++;
        this.logger.warn(`DB connect attempt ${attempt} failed: ${(err as Error).message}`);
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
