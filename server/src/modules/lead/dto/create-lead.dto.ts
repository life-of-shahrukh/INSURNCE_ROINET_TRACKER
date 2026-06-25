import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const PRODUCT_LINES = [
  'HEALTH',
  'MOTOR',
  'LIFE',
  'TRAVEL',
  'COMMERCIAL_LINES',
  'RURAL',
  'HOME',
] as const;

export class CreateLeadDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(36)
  customerId: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  assignedToId?: string;

  @IsNotEmpty()
  @IsEnum(PRODUCT_LINES)
  product: (typeof PRODUCT_LINES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  productSubType?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimatedPremium: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedSum?: number;

  @IsOptional()
  @IsEnum(['THIS_MONTH', 'T_PLUS_1', 'T_PLUS_2', 'LATER'])
  closureTimeline?: 'THIS_MONTH' | 'T_PLUS_1' | 'T_PLUS_2' | 'LATER';

  /**
   * Accept both "YYYY-MM-DD" date strings and full ISO datetimes.
   * Converts to a proper Date object for Prisma.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') return undefined;
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? undefined : d;
  })
  @Type(() => Date)
  expectedCloseDate?: Date;

  @IsOptional()
  @IsEnum(['H', 'W', 'C', 'L'])
  heatStatus?: 'H' | 'W' | 'C' | 'L';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
