import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ExternalPospQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @ApiPropertyOptional({
    description:
      'Free-text search by UserCode, Email, Mobile, City, or HephGcdCode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by ResidenceState name (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by ResidenceCity name (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  city?: string;

  // ── ID-based filters (match Cognitensor ListPospData request params) ────────

  @ApiPropertyOptional({ description: 'Filter by exact UserId (Cognitensor)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by exact UserCode (CSP code)' })
  @IsOptional()
  @IsString()
  userCode?: string;

  @ApiPropertyOptional({
    description:
      'Filter by StateId (Cognitensor). In live mode passed to API; in snapshot mode cross-referenced against states list.',
  })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by DistrictId (Cognitensor). Passed to live API only — snapshot data has no district IDs.',
  })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({
    description:
      'Filter by CityId (Cognitensor). Passed to live API only — snapshot data has no city IDs.',
  })
  @IsOptional()
  @IsString()
  cityId?: string;
}
