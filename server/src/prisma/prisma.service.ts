import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit(): Promise<void> {
    let attempt = 0;
    while (attempt < 3) {
      try {
        await this.$connect();
        return;
      } catch (err) {
        attempt++;
        this.logger.warn(
          `DB connect attempt ${attempt} failed: ${(err as Error).message}`,
        );
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
