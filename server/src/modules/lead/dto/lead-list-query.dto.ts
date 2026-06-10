import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class LeadListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closureTimeline?: string;
}
