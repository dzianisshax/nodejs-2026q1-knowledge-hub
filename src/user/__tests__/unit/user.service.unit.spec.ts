import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { UserService } from '../../user.service';
import { USER_REPOSITORY } from '../../repositories/user.repository.interface';
import { UserRole } from '../../entities/user.entity';
import { ArticleService } from '../../../article/article.service';
import { CommentService } from '../../../comment/comment.service';

const mockUserRepository = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByLogin: vi.fn(),
  create: vi.fn(),
  createWithHash: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const mockArticleService = {
  nullifyAuthorId: vi.fn(),
};

const mockCommentService = {
  removeByAuthorId: vi.fn(),
};

const mockUser = {
  id: 'uuid-1',
  login: 'alice',
  password: 'hashed',
  role: UserRole.VIEWER,
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: ArticleService, useValue: mockArticleService },
        { provide: CommentService, useValue: mockCommentService },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('findAll returns all users', async () => {
    mockUserRepository.findAll.mockResolvedValue([mockUser]);
    const result = await userService.findAll(1, 100);
    expect(result).toEqual({ data: [mockUser], limit: 100, page: 1, total: 1 });
  });

  it('findOne returns user by id', async () => {
    mockUserRepository.findById.mockResolvedValue(mockUser);
    const result = await userService.findOne('uuid-1');
    expect(result).toEqual(mockUser);
  });

  it('findOne returns null for unknown id', async () => {
    mockUserRepository.findById.mockResolvedValue(null);
    const result = await userService.findOne('unknown');
    expect(result).toBeNull();
  });

  it('findByLogin returns user by login', async () => {
    mockUserRepository.findByLogin.mockResolvedValue(mockUser);
    const result = await userService.findByLogin('alice');
    expect(result).toEqual(mockUser);
  });

  it('create delegates to repository', async () => {
    mockUserRepository.create.mockResolvedValue(mockUser);
    const dto = { login: 'alice', password: 'pass' };
    const result = await userService.create(dto);
    expect(mockUserRepository.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(mockUser);
  });

  it('createWithHash delegates to repository', async () => {
    mockUserRepository.createWithHash.mockResolvedValue(mockUser);
    const result = await userService.createWithHash('alice', 'hashed');
    expect(mockUserRepository.createWithHash).toHaveBeenCalledWith(
      'alice',
      'hashed',
    );
    expect(result).toEqual(mockUser);
  });

  it('update delegates to repository', async () => {
    mockUserRepository.update.mockResolvedValue({ ...mockUser, version: 2 });
    const dto = { oldPassword: 'old', newPassword: 'new' };
    const result = await userService.update('uuid-1', dto);
    expect(mockUserRepository.update).toHaveBeenCalledWith('uuid-1', dto);
  });

  it('remove nullifies authorId, removes comments, then deletes user', async () => {
    mockArticleService.nullifyAuthorId.mockResolvedValue(undefined);
    mockCommentService.removeByAuthorId.mockResolvedValue(undefined);
    mockUserRepository.delete.mockResolvedValue(undefined);

    await userService.delete('uuid-1');

    expect(mockArticleService.nullifyAuthorId).toHaveBeenCalledWith('uuid-1');
    expect(mockCommentService.removeByAuthorId).toHaveBeenCalledWith('uuid-1');
    expect(mockUserRepository.delete).toHaveBeenCalledWith('uuid-1');
  });
});
