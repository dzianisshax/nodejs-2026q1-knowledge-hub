import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { CategoryService } from '../../category.service';
import { CATEGORY_REPOSITORY } from '../../repositories/category.repository.interface';
import { ArticleService } from '../../../article/article.service';

const mockCategoryRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockArticleService = { nullifyCategoryId: vi.fn() };

const mockCategory = { id: 'cat-1', name: 'Tech', description: 'Tech stuff' };

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
        { provide: ArticleService, useValue: mockArticleService },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
  });

  it('findAll returns categories', async () => {
    mockCategoryRepository.findAll.mockResolvedValue([mockCategory]);
    expect(await service.findAll(1, 100)).toEqual({
      data: [mockCategory],
      limit: 100,
      page: 1,
      total: 1,
    });
  });

  it('findOne returns category', async () => {
    mockCategoryRepository.findById.mockResolvedValue(mockCategory);
    expect(await service.findOne('cat-1')).toEqual(mockCategory);
  });

  it('findOne returns null when not found', async () => {
    mockCategoryRepository.findById.mockResolvedValue(null);
    expect(await service.findOne('unknown')).toBeNull();
  });

  it('create delegates to repository', async () => {
    mockCategoryRepository.create.mockResolvedValue(mockCategory);
    const result = await service.create({
      name: 'Tech',
      description: 'Tech stuff',
    });
    expect(result).toEqual(mockCategory);
  });

  it('update delegates to repository', async () => {
    const updated = { ...mockCategory, name: 'Updated' };
    mockCategoryRepository.update.mockResolvedValue(updated);
    expect(await service.update('cat-1', { name: 'Updated' })).toEqual(updated);
  });

  it('remove nullifies categoryId then deletes', async () => {
    mockArticleService.nullifyCategoryId.mockResolvedValue(undefined);
    mockCategoryRepository.delete.mockResolvedValue(undefined);

    await service.delete('cat-1');

    expect(mockArticleService.nullifyCategoryId).toHaveBeenCalledWith('cat-1');
    expect(mockCategoryRepository.delete).toHaveBeenCalledWith('cat-1');
  });
});
