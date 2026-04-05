import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ICategoryRepository } from './category.repository.interface';

@Injectable()
export class InMemoryCategoryRepository implements ICategoryRepository {
  private readonly categories: Map<string, Category> = new Map();

  findAll(): Category[] {
    return Array.from(this.categories.values());
  }

  findById(id: string): Category | null {
    return this.categories.get(id) ?? null;
  }

  create(dto: CreateCategoryDto): Category {
    const category: Category = {
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
    };

    this.categories.set(category.id, category);
    return category;
  }

  update(id: string, dto: UpdateCategoryDto): Category {
    const existing = this.categories.get(id)!;
    const updated: Category = {
      ...existing,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
    };

    this.categories.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.categories.delete(id);
  }
}
