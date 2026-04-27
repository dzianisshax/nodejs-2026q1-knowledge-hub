import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SummarizeArticleDto {
  @ApiPropertyOptional({
    enum: ['short', 'medium', 'detailed'],
    default: 'medium',
  })
  @IsOptional()
  @IsIn(['short', 'medium', 'detailed'])
  maxLength?: 'short' | 'medium' | 'detailed' = 'medium';
}
