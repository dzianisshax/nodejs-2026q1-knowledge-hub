import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Content',
    type: String,
  })
  content: string;
  @ApiProperty({
    description: 'Article id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  articleId: string;
  @ApiPropertyOptional({
    description: 'Author id',
    example: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
    type: String,
  })
  authorId?: string | null;
}
