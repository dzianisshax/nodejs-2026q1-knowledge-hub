import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

export interface ICategoryRepository {
  findAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(dto: CreateCategoryDto): Promise<Category>;
  update(id: string, dto: UpdateCategoryDto): Promise<Category>;
  delete(id: string): Promise<void>;
}
