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
      'Free-text search by username, UserCode, Email, Mobile, or HephGcdCode',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by state name (resolved to stateId via snapshot)',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by city name (resolved to cityId via snapshot)',
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
      'Filter by CityId (Cognitensor). In live mode passed to API; in snapshot mode matched against Posp.cityid.',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  // ── Manager-level filters (resolved to a district set via DistrictHierarchy) ─

  @ApiPropertyOptional({
    description: 'Group/filter POSPs by a specific District Manager (code)',
  })
  @IsOptional()
  @IsString()
  dmCode?: string;

  @ApiPropertyOptional({
    description: 'Group/filter POSPs by a specific ASM (code)',
  })
  @IsOptional()
  @IsString()
  asmCode?: string;

  @ApiPropertyOptional({
    description: 'Group/filter POSPs by a specific RH (code)',
  })
  @IsOptional()
  @IsString()
  rhCode?: string;
}
