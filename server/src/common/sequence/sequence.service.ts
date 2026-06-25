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

    const row = await this.prisma.$queryRaw<{ lastValue: number }[]>`
      MERGE INTO [Sequence] WITH (HOLDLOCK) AS target
      USING (SELECT ${type} AS id, ${year} AS year) AS source
        ON target.id = source.id AND target.year = source.year
      WHEN MATCHED THEN
        UPDATE SET lastValue = target.lastValue + 1, updatedAt = GETDATE()
      WHEN NOT MATCHED THEN
        INSERT (id, year, lastValue, updatedAt)
        VALUES (source.id, source.year, 1, GETDATE())
      OUTPUT inserted.lastValue;
    `;

    const seq = row[0]?.lastValue ?? 1;
    const padded = String(seq).padStart(5, '0');
    return `${prefix}-${year}-${padded}`;
  }
}
