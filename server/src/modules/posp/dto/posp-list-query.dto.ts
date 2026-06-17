import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class PospListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string;

  // ── Scoped geographic filters (intersected with the caller's territory) ──

  @ApiPropertyOptional({ description: 'Filter POSPs by Cognitensor StateId' })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Filter POSPs by Cognitensor CityId' })
  @IsOptional()
  @IsString()
  cityId?: string;

  // ── Manager-level filters (resolved to a district set via DistrictHierarchy) ─

  @ApiPropertyOptional({
    description: 'Filter POSPs under a specific DM (code)',
  })
  @IsOptional()
  @IsString()
  dmCode?: string;

  @ApiPropertyOptional({
    description: 'Filter POSPs under a specific ASM (code)',
  })
  @IsOptional()
  @IsString()
  asmCode?: string;

  @ApiPropertyOptional({
    description: 'Filter POSPs under a specific RH (code)',
  })
  @IsOptional()
  @IsString()
  rhCode?: string;
}
