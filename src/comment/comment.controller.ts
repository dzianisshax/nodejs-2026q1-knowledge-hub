import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query('articleId') articleId: string) {
    if (!articleId) {
      throw new BadRequestException('Query parameter articleId is required');
    }

    return this.commentService.findAllByArticleId(articleId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto) {
    if (!createCommentDto.content || !createCommentDto.articleId) {
      throw new BadRequestException(
        'Request body must contain content and articleId',
      );
    }

    return this.commentService.create(createCommentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`commentId ${id} is invalid (not uuid)`);
    }

    const comment = this.commentService.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    this.commentService.delete(id);
  }
}
