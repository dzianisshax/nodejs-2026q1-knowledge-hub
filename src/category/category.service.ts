import { Inject, Injectable } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from './repositories/category.repository.interface';
import { ArticleService } from '../article/article.service';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { paginate } from '../common/helpers/paginate.helper';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
    private readonly articleService: ArticleService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<Category>> {
    return paginate(await this.categoryRepository.findAll(), page, limit);
  }

  async findOne(id: string): Promise<Category | null> {
    return this.categoryRepository.findById(id);
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.categoryRepository.create(dto);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.categoryRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.articleService.nullifyCategoryId(id);
    await this.categoryRepository.delete(id);
  }
}
