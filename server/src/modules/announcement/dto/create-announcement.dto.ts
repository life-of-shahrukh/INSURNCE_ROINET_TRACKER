import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsIn,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_ROLES = [
  'SUPER_ADMIN',
  'NATIONAL_HEAD',
  'ZH',
  'RH',
  'ASM',
  'DM',
  'POSP',
] as const;

const VALID_SEVERITIES = ['info', 'warning', 'success', 'error'] as const;

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'System Maintenance Tonight' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'The system will be down from 11 PM to 1 AM.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;

  @ApiProperty({
    description: 'Comma-separated target roles',
    example: 'POSP,DM,ASM',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  targetRoles: string;

  @ApiPropertyOptional({ enum: VALID_SEVERITIES, default: 'info' })
  @IsOptional()
  @IsIn(VALID_SEVERITIES)
  severity?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
