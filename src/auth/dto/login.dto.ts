import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User login',
    example: 'Admin',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    description: 'User password',
    example: '123456',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
