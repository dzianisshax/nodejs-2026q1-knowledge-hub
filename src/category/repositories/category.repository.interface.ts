import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  findAll(): Category[];
  findById(id: string): Category | null;
  create(dto: CreateCategoryDto): Category;
  update(id: string, dto: UpdateCategoryDto): Category;
  delete(id: string): void;
}
