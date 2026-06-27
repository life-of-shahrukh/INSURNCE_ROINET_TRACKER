import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum UxEventType {
  PAGEVIEW = 'pageview',
  CLICK = 'click',
  HOVER_DWELL = 'hover_dwell',
  SCROLL_DEPTH = 'scroll_depth',
  RAGE_CLICK = 'rage_click',
  DEAD_CLICK = 'dead_click',
  FORM_FOCUS = 'form_focus',
  FORM_BLUR = 'form_blur',
}

export class UxEventDto {
  @IsEnum(UxEventType)
  type!: UxEventType;

  @IsNumber()
  timestamp!: number;

  @IsString()
  @MaxLength(500)
  page!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  target?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  targetText?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class UxIdentityDto {
  @IsString()
  userId!: string;

  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  pospId!: string | null;
}

export class UxEventBatchDto {
  @ValidateNested()
  @Type(() => UxIdentityDto)
  identity!: UxIdentityDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UxEventDto)
  events!: UxEventDto[];
}
