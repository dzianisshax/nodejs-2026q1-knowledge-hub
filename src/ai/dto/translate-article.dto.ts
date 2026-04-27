import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateArticleDto {
  @ApiProperty({ example: 'Spanish' })
  @IsString()
  @IsNotEmpty()
  targetLanguage: string;

  @ApiPropertyOptional({ example: 'English' })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
