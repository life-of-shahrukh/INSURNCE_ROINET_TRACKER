import { IsOptional, IsString } from 'class-validator';

export class SearchPayoutGridDto {
  @IsOptional()
  @IsString()
  lob?: string;

  @IsOptional()
  @IsString()
  insurer?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  query?: string;
}
