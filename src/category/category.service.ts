import { Inject, Injectable } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CATEGORY_REPOSITORY,
  ICategoryRepository,
} from './repositories/category.repository.interface';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  findAll(): Category[] {
    return this.categoryRepository.findAll();
  }

  findOne(id: string): Category | null {
    return this.categoryRepository.findById(id);
  }

  create(dto: CreateCategoryDto): Category {
    return this.categoryRepository.create(dto);
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    return this.categoryRepository.update(id, dto);
  }

  delete(id: string): void {
    this.categoryRepository.delete(id);
  }
}
