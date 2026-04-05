import { ApiProperty } from '@nestjs/swagger';
import { User, UserRole } from '../entities/user.entity';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

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
    enum: UserRole,
  })
  role?: UserRole;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.role = user.role;
    return dto;
  }

  static fromPaginated(
    paginated: PaginatedResponseDto<User>,
  ): PaginatedResponseDto<UserResponseDto> {
    return new PaginatedResponseDto(
      paginated.data.map((u) => UserResponseDto.fromEntity(u)),
      paginated.total,
      paginated.page,
      paginated.limit,
    );
  }
}
