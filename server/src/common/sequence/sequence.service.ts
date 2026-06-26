import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SequenceType = 'CUSTOMER' | 'PROPOSAL';

const PREFIX_MAP: Record<SequenceType, string> = {
  CUSTOMER: 'ROI-CUST',
  PROPOSAL: 'PROP',
};

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically increments the counter for a given sequence type and year,
   * returning the formatted code (e.g. ROI-CUST-2026-00001).
   */
  async nextCode(type: SequenceType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = PREFIX_MAP[type];

    const row = await this.prisma.$queryRaw<{ lastvalue: number }[]>`
      INSERT INTO "Sequence" (id, year, "lastValue", "updatedAt")
      VALUES (${type}, ${year}, 1, NOW())
      ON CONFLICT (id, year)
      DO UPDATE SET "lastValue" = "Sequence"."lastValue" + 1, "updatedAt" = NOW()
      RETURNING "lastValue"
    `;

    const seq = row[0]?.lastvalue ?? 1;
    const padded = String(seq).padStart(5, '0');
    return `${prefix}-${year}-${padded}`;
  }
}
