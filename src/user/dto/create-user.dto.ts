import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User login',
    example: 'Admin',
    type: String,
  })
  login: string;
  @ApiProperty({
    description: 'User password',
    example: '123456',
    type: String,
  })
  password: string;
  @ApiPropertyOptional({
    description: 'User role',
    example: 'admin',
    type: String,
  })
  role?: 'admin' | 'editor' | 'viewer'; // defaults to 'viewer'
}
