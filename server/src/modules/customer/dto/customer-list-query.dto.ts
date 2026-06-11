import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsArray, IsOptional, IsString } from 'class-validator';

import { QueryStringArray } from '../../../common/decorators/query-string-array.decorator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CustomerListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateRange?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @QueryStringArray()
  kycStatus?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @QueryStringArray()
  source?: string[];
}
