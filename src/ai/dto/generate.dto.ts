import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDto {
  @ApiProperty({ example: 'Explain what REST APIs are.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  prompt: string;

  @ApiPropertyOptional({ description: 'Session ID for conversation context' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
