import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadDto } from './create-lead.dto';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @IsOptional()
  @IsEnum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'])
  status?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'WON' | 'LOST';

  /** When set on a non-converted lead, triggers deal creation (requires policy number). */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  proposal?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (!value || value === '') return undefined;
    const d = new Date(value as string);
    return isNaN(d.getTime()) ? undefined : d;
  })
  @Type(() => Date)
  issued?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  coa?: number;

  @IsOptional()
  @IsEnum(['PERCENT', 'AMOUNT'])
  coaType?: 'PERCENT' | 'AMOUNT';

  @IsOptional()
  @IsNumber()
  @Min(0)
  margin?: number;
}
