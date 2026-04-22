import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { UpdatePasswordDto } from '../../user/dto/update-password.dto';
import { CreateArticleDto } from '../../article/dto/create-article.dto';
import { UpdateArticleDto } from '../../article/dto/update-article.dto';
import { CreateCategoryDto } from '../../category/dto/create-category.dto';
import { CreateCommentDto } from '../../comment/dto/create-comment.dto';
import { SignupDto } from '../../auth/dto/signup.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { RefreshDto } from '../../auth/dto/refresh.dto';
import { ArticleStatus } from '../../article/entities/article.entity';
import { UserRole } from '../../user/entities/user.entity';

async function expectValid(DtoClass: any, data: object) {
  const instance = plainToInstance(DtoClass, data);
  const errors = await validate(instance);
  expect(errors).toHaveLength(0);
}

async function expectInvalid(DtoClass: any, data: object) {
  const instance = plainToInstance(DtoClass, data);
  const errors = await validate(instance);
  expect(errors.length).toBeGreaterThan(0);
}

describe('DTO Validation', () => {
  describe('SignupDto', () => {
    it('passes with valid login and password', () =>
      expectValid(SignupDto, { login: 'alice', password: 'pass123' }));
    it('fails with missing login', () =>
      expectInvalid(SignupDto, { password: 'pass123' }));
    it('fails with missing password', () =>
      expectInvalid(SignupDto, { login: 'alice' }));
    it('fails with empty login', () =>
      expectInvalid(SignupDto, { login: '', password: 'pass' }));
    it('fails with non-string login', () =>
      expectInvalid(SignupDto, { login: 123, password: 'pass' }));
  });

  describe('LoginDto', () => {
    it('passes with valid credentials', () =>
      expectValid(LoginDto, { login: 'alice', password: 'pass123' }));
    it('fails with missing login', () =>
      expectInvalid(LoginDto, { password: 'pass' }));
    it('fails with missing password', () =>
      expectInvalid(LoginDto, { login: 'alice' }));
  });

  describe('RefreshDto', () => {
    it('passes with valid refreshToken', () =>
      expectValid(RefreshDto, { refreshToken: 'some.jwt.token' }));
    it('fails with missing refreshToken', () => expectInvalid(RefreshDto, {}));
    it('fails with empty refreshToken', () =>
      expectInvalid(RefreshDto, { refreshToken: '' }));
  });

  describe('CreateUserDto', () => {
    it('passes with login and password', () =>
      expectValid(CreateUserDto, { login: 'alice', password: 'pass' }));
    it('passes with optional role', () =>
      expectValid(CreateUserDto, {
        login: 'alice',
        password: 'pass',
        role: UserRole.ADMIN,
      }));
    it('fails with invalid role', () =>
      expectInvalid(CreateUserDto, {
        login: 'alice',
        password: 'pass',
        role: 'superuser',
      }));
    it('fails with missing login', () =>
      expectInvalid(CreateUserDto, { password: 'pass' }));
  });

  describe('UpdatePasswordDto', () => {
    it('passes with both passwords', () =>
      expectValid(UpdatePasswordDto, {
        oldPassword: 'old',
        newPassword: 'new',
      }));
    it('fails with missing oldPassword', () =>
      expectInvalid(UpdatePasswordDto, { newPassword: 'new' }));
    it('fails with missing newPassword', () =>
      expectInvalid(UpdatePasswordDto, { oldPassword: 'old' }));
  });

  describe('CreateArticleDto', () => {
    it('passes with title and content', () =>
      expectValid(CreateArticleDto, { title: 'T', content: 'C' }));
    it('passes with valid status enum', () =>
      expectValid(CreateArticleDto, {
        title: 'T',
        content: 'C',
        status: ArticleStatus.PUBLISHED,
      }));
    it('fails with invalid status', () =>
      expectInvalid(CreateArticleDto, {
        title: 'T',
        content: 'C',
        status: 'invalid',
      }));
    it('fails with missing title', () =>
      expectInvalid(CreateArticleDto, { content: 'C' }));
    it('fails with missing content', () =>
      expectInvalid(CreateArticleDto, { title: 'T' }));
    it('fails with non-string title', () =>
      expectInvalid(CreateArticleDto, { title: true, content: 'C' }));
    it('passes with tags array', () =>
      expectValid(CreateArticleDto, {
        title: 'T',
        content: 'C',
        tags: ['nodejs'],
      }));
    it('fails with non-array tags', () =>
      expectInvalid(CreateArticleDto, {
        title: 'T',
        content: 'C',
        tags: 'nodejs',
      }));
  });

  describe('UpdateArticleDto', () => {
    it('passes with empty object (all optional)', () =>
      expectValid(UpdateArticleDto, {}));
    it('passes with partial update', () =>
      expectValid(UpdateArticleDto, { title: 'New Title' }));
    it('fails with invalid status', () =>
      expectInvalid(UpdateArticleDto, { status: 'wrong' }));
    it('fails with non-string title', () =>
      expectInvalid(UpdateArticleDto, { title: 123 }));
  });

  describe('CreateCategoryDto', () => {
    it('passes with name and description', () =>
      expectValid(CreateCategoryDto, {
        name: 'Tech',
        description: 'Tech stuff',
      }));
    it('fails with missing name', () =>
      expectInvalid(CreateCategoryDto, { description: 'desc' }));
    it('fails with missing description', () =>
      expectInvalid(CreateCategoryDto, { name: 'Tech' }));
  });

  describe('CreateCommentDto', () => {
    it('passes with content and valid articleId', () =>
      expectValid(CreateCommentDto, {
        content: 'Great!',
        articleId: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
      }));
    it('fails with missing content', () =>
      expectInvalid(CreateCommentDto, {
        articleId: '97cf267d-ce98-4b79-b199-7d2fffa39ad4',
      }));
    it('fails with missing articleId', () =>
      expectInvalid(CreateCommentDto, { content: 'Great!' }));
    it('fails with invalid articleId uuid', () =>
      expectInvalid(CreateCommentDto, {
        content: 'Great!',
        articleId: 'not-a-uuid',
      }));
  });
});
