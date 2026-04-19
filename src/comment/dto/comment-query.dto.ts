import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CommentQueryDto extends PaginationQueryDto {
  @ApiProperty({
    type: String,
    description: 'Article uuid to fetch comments for',
  })
  @IsUUID(4)
  @IsNotEmpty()
  articleId: string;
}
