import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User uuid',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  id: string;
  @ApiProperty({
    description: 'User login',
    example: 'Admin',
    type: String,
  })
  login: string;
  @ApiProperty({
    description: 'User role',
    example: 'admin',
    type: String,
  })
  role?: 'admin' | 'editor' | 'viewer';

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.role = user.role;
    return dto;
  }

  static fromEntities(users: User[]): UserResponseDto[] {
    return users.map((u) => UserResponseDto.fromEntity(u));
  }
}
