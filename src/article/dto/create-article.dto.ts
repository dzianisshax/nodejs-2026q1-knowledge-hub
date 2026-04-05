import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsArray,
  IsUUID,
  ArrayUnique,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Article title',
    example: 'Title',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Article content',
    example: 'Content',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  content: string;

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
