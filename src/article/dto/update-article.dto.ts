import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateArticleDto {
  @ApiPropertyOptional({
    description: 'Article title',
    example: 'Title',
    type: String,
  })
  title?: string;
  @ApiPropertyOptional({
    description: 'Article content',
    example: 'Content',
    type: String,
  })
  content?: string;
  @ApiPropertyOptional({
    description: 'Article status',
    example: 'draft',
    type: String,
  })
  status?: 'draft' | 'published' | 'archived';
  @ApiPropertyOptional({
    description: 'Author id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  authorId?: string | null;
  @ApiPropertyOptional({
    description: 'Category id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  categoryId?: string | null;
  @ApiPropertyOptional({
    description: 'Article tags',
    example: ['Tag'],
    type: [String],
  })
  tags?: string[];
}
