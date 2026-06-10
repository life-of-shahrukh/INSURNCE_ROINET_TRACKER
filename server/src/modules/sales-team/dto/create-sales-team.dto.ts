import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSalesTeamDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(36)
  userId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  employeeCode: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  designation: string;

  @IsOptional()
  @IsString()
  @MaxLength(36)
  managerId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  territory?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  mobile: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsNotEmpty()
  joiningDate: Date;
}
