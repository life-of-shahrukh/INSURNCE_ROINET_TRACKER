import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsArray, IsOptional, IsString } from 'class-validator';

import { QueryStringArray } from '../../../common/decorators/query-string-array.decorator';

import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class CustomerListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @QueryStringArray()
  kycStatus?: string[];
}
