import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

import { QueryStringArray } from '../../../common/decorators/query-string-array.decorator';

import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class DealListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({ type: [String], enum: ['H', 'W', 'C', 'D'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @QueryStringArray()
  dealStatus?: string[];

  @ApiPropertyOptional({ type: [String], enum: ['issued', 'pending'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @QueryStringArray()
  policyStatus?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  premiumRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['true', 'false'])
  renewals?: string;

  @ApiPropertyOptional({
    description:
      'When true, only deals converted from WON leads (policy # set)',
  })
  @IsOptional()
  @IsIn(['true', 'false'])
  wonOnly?: string;
}
