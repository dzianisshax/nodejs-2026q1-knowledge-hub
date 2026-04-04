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
import { ApiQuery } from '@nestjs/swagger';

@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'tag', required: false, type: String })
  findAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.articleService.findAll({ status, categoryId, tag });
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
    if (!createArticleDto.title || !createArticleDto.content) {
      throw new BadRequestException(
        'Request body must contain title and content',
      );
    }

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
