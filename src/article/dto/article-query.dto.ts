import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ArticleStatus } from '../entities/article.entity';

export class ArticleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsUUID(4)
  categoryId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  tag?: string;
}
