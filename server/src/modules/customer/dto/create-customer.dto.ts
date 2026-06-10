import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  mobile: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  alternateMobile?: string;

  @IsOptional()
  dateOfBirth?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  aadharNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stateId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  stateName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  districtId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  districtName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  cityId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cityName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}
