import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'User old password',
    example: 'old weak password',
    type: String,
  })
  oldPassword: string;
  @ApiProperty({
    description: 'User new password',
    example: 'new strong password',
    type: String,
  })
  newPassword: string;
}
