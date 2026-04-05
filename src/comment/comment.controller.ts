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
import { CommentQueryDto } from './dto/comment-query.dto';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: CommentQueryDto) {
    const paginated = this.commentService.findAllByArticleId(
      query.articleId,
      query.page,
      query.limit,
    );
    return paginated.data;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`commentId ${id} is invalid (not uuid)`);
    }

    const comment = this.commentService.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCommentDto: CreateCommentDto) {
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
