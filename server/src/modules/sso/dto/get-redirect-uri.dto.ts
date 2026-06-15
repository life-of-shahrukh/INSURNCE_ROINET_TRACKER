import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetRedirectUriDto {
  @ApiProperty({
    description:
      'Opaque user identifier issued by the central SSO server. Will be embedded into the signed token and used to look up the user on verification.',
    example: 'user@roinet.com',
  })
  @IsString()
  @IsNotEmpty()
  userCode: string;
}
