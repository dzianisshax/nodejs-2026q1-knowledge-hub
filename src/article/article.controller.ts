import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../user/entities/user.entity';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { BearerAuth } from '../auth/decorators/bearer-auth.decorator';
import { ForbiddenError, NotFoundError } from '../common/errors/app-errors';

@BearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ArticleQueryDto) {
    const paginated = await this.articleService.findAll(
      { status: query.status, categoryId: query.categoryId, tag: query.tag },
      query.page,
      query.limit,
    );
    return paginated.data;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = await this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    return article;
  }

  @Post()
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateArticleDto, @CurrentUser() user: JwtPayload) {
    // Automatically assign authorId from JWT for editors
    if (user.role === UserRole.EDITOR) {
      dto.authorId = user.userId;
    }

    return await this.articleService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.EDITOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = await this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    if (user.role === UserRole.EDITOR && article.authorId !== user.userId) {
      throw new ForbiddenError('Editors can only update their own articles');
    }

    return await this.articleService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = await this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundError(`Article with id ${id} not found`);
    }

    await this.articleService.delete(id);
  }
}
