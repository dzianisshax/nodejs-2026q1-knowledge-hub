import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'User old password',
    example: 'old weak password',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    description: 'User new password',
    example: 'new strong password',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
