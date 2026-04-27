import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeArticleDto {
  @ApiPropertyOptional({
    enum: ['review', 'bugs', 'optimize', 'explain'],
    default: 'review',
  })
  @IsOptional()
  @IsIn(['review', 'bugs', 'optimize', 'explain'])
  task?: 'review' | 'bugs' | 'optimize' | 'explain' = 'review';
}
