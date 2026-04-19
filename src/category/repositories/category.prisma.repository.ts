import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ICategoryRepository } from './category.repository.interface';
import { Category } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  async findById(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } }) ?? null;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
