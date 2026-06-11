import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { DealStatus } from '../../../common/constants';

export class CreateDealDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxx' })
  @IsString()
  @IsNotEmpty()
  pospId: string;

  @ApiProperty({ example: 'Rajesh Mehta' })
  @IsString()
  @IsNotEmpty()
  customer: string;

  @ApiProperty({ example: 'Life' })
  @IsString()
  @IsNotEmpty()
  policy: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @Min(0)
  sum: number;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @Min(0)
  premium: number;

  @ApiProperty({ example: 6000 })
  @IsNumber()
  @Min(0)
  coa: number;

  @ApiProperty({ example: 3000 })
  @IsNumber()
  @Min(0)
  margin: number;

  @ApiProperty({ enum: ['H', 'W', 'C'], example: 'W' })
  @IsIn(Object.values(DealStatus))
  status: DealStatus;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  expected: string;

  @ApiProperty({ example: 'PRP-22301' })
  @IsString()
  @IsNotEmpty()
  proposal: string;

  @ApiProperty({ example: 'POL-99812' })
  @IsString()
  @IsNotEmpty()
  policyNo: string;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  issued: string;

  @ApiPropertyOptional({ example: 'Awaiting medical' })
  @IsString()
  @IsOptional()
  remarks?: string;
}
