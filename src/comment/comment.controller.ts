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
  ForbiddenException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BearerAuth } from '../auth/decorators/bearer-auth.decorator';

@BearerAuth()
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: CommentQueryDto) {
    const paginated = await this.commentService.findAllByArticleId(
      query.articleId,
      query.page,
      query.limit,
    );
    return paginated.data;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`commentId ${id} is invalid (not uuid)`);
    }

    const comment = await this.commentService.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    return comment;
  }

  @Post()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateCommentDto, @CurrentUser() user: JwtPayload) {
    if (user.role === UserRole.EDITOR) {
      dto.authorId = user.userId;
    }
    return await this.commentService.create(dto);
  }

  @Delete(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    if (!isUuid(id)) {
      throw new BadRequestException(`commentId ${id} is invalid (not uuid)`);
    }

    const comment = await this.commentService.findOne(id);

    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }

    if (user.role === UserRole.EDITOR && comment.authorId !== user.userId) {
      throw new ForbiddenException(
        'Editors can only delete their own comments',
      );
    }

    await this.commentService.delete(id);
  }
}
