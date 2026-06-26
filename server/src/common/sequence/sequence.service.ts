import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';

export type SequenceType = 'CUSTOMER' | 'PROPOSAL';

const PREFIX_MAP: Record<SequenceType, string> = {
  CUSTOMER: 'ROI-CUST',
  PROPOSAL: 'PROP',
};

@Injectable()
export class SequenceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Atomically increments the counter for a given sequence type and year,
   * returning the formatted code (e.g. ROI-CUST-2026-00001).
   * Uses Prisma upsert which maps to INSERT ... ON CONFLICT DO UPDATE internally.
   */
  async nextCode(type: SequenceType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = PREFIX_MAP[type];

    const result = await this.prisma.sequence.upsert({
      where: { id_year: { id: type, year } },
      create: { id: type, year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
      select: { lastValue: true },
    });

    const padded = String(result.lastValue).padStart(5, '0');
    const code = `${prefix}-${year}-${padded}`;

    this.logger.debug('Sequence code generated', {
      context: 'SequenceService',
      type,
      code,
    });

    return code;
  }
}
