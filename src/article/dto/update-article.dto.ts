import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
  ArrayUnique,
} from 'class-validator';

export class UpdateArticleDto {
  @ApiPropertyOptional({
    description: 'Article title',
    example: 'Title',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    description: 'Article content',
    example: 'Content',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    description: 'Article status',
    example: 'draft',
    type: String,
  })
  @IsOptional()
  @IsIn(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @ApiPropertyOptional({
    description: 'Author id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  @IsOptional()
  @IsUUID(4)
  authorId?: string | null;

  @ApiPropertyOptional({
    description: 'Category id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string | null;

  @ApiPropertyOptional({
    description: 'Article tags',
    example: ['Tag'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  tags?: string[];
}
