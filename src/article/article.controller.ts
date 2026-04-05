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
  NotFoundException,
} from '@nestjs/common';
import { validate as isUuid } from 'uuid';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleQueryDto } from './dto/article-query.dto';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: ArticleQueryDto) {
    const paginated = this.articleService.findAll(
      { status: query.status, categoryId: query.categoryId, tag: query.tag },
      query.page,
      query.limit,
    );
    return paginated.data;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return article;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articleService.create(createArticleDto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException(`articleId ${id} is invalid (not uuid)`);
    }

    const article = this.articleService.findOne(id);

    if (!article) {
      throw new NotFoundException(`Article with id ${id} not found`);
    }

    this.articleService.delete(id);
  }
}
