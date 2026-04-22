import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { CommentService } from '../../comment.service';
import { COMMENT_REPOSITORY } from '../../repositories/comment.repository.interface';
import { ArticleService } from '../../../article/article.service';

const mockCommentRepository = {
  findAllByArticleId: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  deleteByArticleId: vi.fn(),
  deleteByAuthorId: vi.fn(),
};

const mockArticleService = { findOne: vi.fn() };

const mockComment = {
  id: 'com-1',
  content: 'Great!',
  articleId: 'art-1',
  authorId: 'user-1',
  createdAt: Date.now(),
};

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: COMMENT_REPOSITORY, useValue: mockCommentRepository },
        { provide: ArticleService, useValue: mockArticleService },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
  });

  it('findAllByArticleId returns comments', async () => {
    mockCommentRepository.findAllByArticleId.mockResolvedValue([mockComment]);
    const result = await service.findAllByArticleId('art-1', 1, 10);
    expect(result).toEqual({
      data: [mockComment],
      limit: 10,
      page: 1,
      total: 1,
    });
  });

  it('findOne returns comment by id', async () => {
    mockCommentRepository.findById.mockResolvedValue(mockComment);
    expect(await service.findOne('com-1')).toEqual(mockComment);
  });

  it('findOne returns null when not found', async () => {
    mockCommentRepository.findById.mockResolvedValue(null);
    expect(await service.findOne('unknown')).toBeNull();
  });

  it('create throws UnprocessableEntityException if article not found', async () => {
    mockArticleService.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        content: 'Hi',
        articleId: 'missing-art',
        authorId: null,
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('create saves comment when article exists', async () => {
    mockArticleService.findOne.mockResolvedValue({ id: 'art-1' });
    mockCommentRepository.create.mockResolvedValue(mockComment);

    const result = await service.create({
      content: 'Great!',
      articleId: 'art-1',
      authorId: 'user-1',
    });
    expect(result).toEqual(mockComment);
  });

  it('remove deletes comment by id', async () => {
    mockCommentRepository.delete.mockResolvedValue(undefined);
    await service.delete('com-1');
    expect(mockCommentRepository.delete).toHaveBeenCalledWith('com-1');
  });

  it('removeByArticleId deletes all comments for article', async () => {
    mockCommentRepository.deleteByArticleId.mockResolvedValue(undefined);
    await service.removeByArticleId('art-1');
    expect(mockCommentRepository.deleteByArticleId).toHaveBeenCalledWith(
      'art-1',
    );
  });

  it('removeByAuthorId deletes all comments by author', async () => {
    mockCommentRepository.deleteByAuthorId.mockResolvedValue(undefined);
    await service.removeByAuthorId('user-1');
    expect(mockCommentRepository.deleteByAuthorId).toHaveBeenCalledWith(
      'user-1',
    );
  });
});
