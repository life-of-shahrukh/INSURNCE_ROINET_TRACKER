import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class PospListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @IsOptional()
  @IsIn(['true', 'false'])
  active?: string;
}
