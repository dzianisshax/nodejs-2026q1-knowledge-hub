import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ArticleService } from '../../article.service';
import { ARTICLE_REPOSITORY } from '../../repositories/article.repository.interface';
import { ArticleStatus } from '../../entities/article.entity';
import { CommentService } from '../../../comment/comment.service';

const mockArticleRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  nullifyAuthorId: vi.fn(),
  nullifyCategoryId: vi.fn(),
};

const mockCommentService = {
  removeByArticleId: vi.fn(),
};

const makeArticle = (overrides = {}) => ({
  id: 'art-uuid-1',
  title: 'Test Article',
  content: 'Content here',
  status: ArticleStatus.DRAFT,
  authorId: 'user-uuid-1',
  categoryId: null,
  tags: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('ArticleService', () => {
  let articleService: ArticleService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: ARTICLE_REPOSITORY, useValue: mockArticleRepository },
        { provide: CommentService, useValue: mockCommentService },
      ],
    }).compile();

    articleService = module.get<ArticleService>(ArticleService);
  });

  describe('findAll', () => {
    it('returns all articles without filters', async () => {
      mockArticleRepository.findAll.mockResolvedValue([makeArticle()]);
      const result = await articleService.findAll({}, 1, 100);
      expect(result.data).toHaveLength(1);
    });

    it('passes status filter to repository', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      await articleService.findAll({ status: ArticleStatus.PUBLISHED }, 1, 100);
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith({
        status: ArticleStatus.PUBLISHED,
      });
    });

    it('passes categoryId filter to repository', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      await articleService.findAll({ categoryId: 'cat-1' }, 1, 100);
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith({
        categoryId: 'cat-1',
      });
    });

    it('passes tag filter to repository', async () => {
      mockArticleRepository.findAll.mockResolvedValue([]);
      await articleService.findAll({ tag: 'nodejs' }, 1, 100);
      expect(mockArticleRepository.findAll).toHaveBeenCalledWith({
        tag: 'nodejs',
      });
    });
  });

  describe('findOne', () => {
    it('returns article by id', async () => {
      const article = makeArticle();
      mockArticleRepository.findById.mockResolvedValue(article);
      expect(await articleService.findOne('art-uuid-1')).toEqual(article);
    });

    it('returns null for unknown id', async () => {
      mockArticleRepository.findById.mockResolvedValue(null);
      expect(await articleService.findOne('unknown')).toBeNull();
    });
  });

  describe('create', () => {
    it('creates an article with draft status by default', async () => {
      const article = makeArticle({ status: ArticleStatus.DRAFT });
      mockArticleRepository.create.mockResolvedValue(article);

      const result = await articleService.create({
        title: 'Test Article',
        content: 'Content here',
      });

      expect(result.status).toBe(ArticleStatus.DRAFT);
    });

    it('creates an article with tags', async () => {
      const article = makeArticle({ tags: ['nodejs', 'typescript'] });
      mockArticleRepository.create.mockResolvedValue(article);

      const result = await articleService.create({
        title: 'Test',
        content: 'Content',
        tags: ['nodejs', 'typescript'],
      });

      expect(result.tags).toContain('nodejs');
      expect(result.tags).toContain('typescript');
    });

    it('creates article with explicit published status', async () => {
      const article = makeArticle({ status: ArticleStatus.PUBLISHED });
      mockArticleRepository.create.mockResolvedValue(article);

      const result = await articleService.create({
        title: 'Test',
        content: 'Content',
        status: ArticleStatus.PUBLISHED,
      });

      expect(result.status).toBe(ArticleStatus.PUBLISHED);
    });
  });

  describe('update', () => {
    it('updates status from draft to published', async () => {
      const updated = makeArticle({ status: ArticleStatus.PUBLISHED });
      mockArticleRepository.update.mockResolvedValue(updated);

      const result = await articleService.update('art-uuid-1', {
        status: ArticleStatus.PUBLISHED,
      });

      expect(result.status).toBe(ArticleStatus.PUBLISHED);
    });

    it('updates status from published to archived', async () => {
      const updated = makeArticle({ status: ArticleStatus.ARCHIVED });
      mockArticleRepository.update.mockResolvedValue(updated);

      const result = await articleService.update('art-uuid-1', {
        status: ArticleStatus.ARCHIVED,
      });

      expect(result.status).toBe(ArticleStatus.ARCHIVED);
    });

    it('replaces tags on update', async () => {
      const updated = makeArticle({ tags: ['docker'] });
      mockArticleRepository.update.mockResolvedValue(updated);

      const result = await articleService.update('art-uuid-1', {
        tags: ['docker'],
      });

      expect(result.tags).toEqual(['docker']);
    });
  });

  describe('remove', () => {
    it('removes article comments then deletes article', async () => {
      mockCommentService.removeByArticleId.mockResolvedValue(undefined);
      mockArticleRepository.delete.mockResolvedValue(undefined);

      await articleService.delete('art-uuid-1');

      expect(mockCommentService.removeByArticleId).toHaveBeenCalledWith(
        'art-uuid-1',
      );
      expect(mockArticleRepository.delete).toHaveBeenCalledWith('art-uuid-1');
    });
  });

  describe('nullifyAuthorId', () => {
    it('delegates to repository', async () => {
      mockArticleRepository.nullifyAuthorId.mockResolvedValue(undefined);
      await articleService.nullifyAuthorId('user-1');
      expect(mockArticleRepository.nullifyAuthorId).toHaveBeenCalledWith(
        'user-1',
      );
    });
  });

  describe('nullifyCategoryId', () => {
    it('delegates to repository', async () => {
      mockArticleRepository.nullifyCategoryId.mockResolvedValue(undefined);
      await articleService.nullifyCategoryId('cat-1');
      expect(mockArticleRepository.nullifyCategoryId).toHaveBeenCalledWith(
        'cat-1',
      );
    });
  });
});
