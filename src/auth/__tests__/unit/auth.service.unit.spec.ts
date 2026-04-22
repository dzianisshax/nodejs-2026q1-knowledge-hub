vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed'),
  compare: vi.fn().mockResolvedValue(true),
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../../auth.service';
import { UserService } from '../../../user/user.service';
import { UserRole } from '../../../user/entities/user.entity';
import {
  ForbiddenError,
  UnauthorizedError,
  ValidationError,
} from '../../../common/errors/app-errors';

const mockUserService = {
  findByLogin: vi.fn(),
  createWithHash: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

const mockUser = {
  id: 'user-uuid-1',
  login: 'testuser',
  password: '$2a$10$hashedpassword',
  role: UserRole.VIEWER,
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('signup', () => {
    it('should create a new user and return id, login, role', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);
      mockUserService.createWithHash.mockResolvedValue(mockUser);

      const result = await authService.signup({
        login: 'testuser',
        password: 'pass123',
      });

      expect(result).toEqual({
        id: mockUser.id,
        login: mockUser.login,
        role: mockUser.role,
      });
      expect(mockUserService.createWithHash).toHaveBeenCalledWith(
        'testuser',
        'hashed',
      );
    });

    it('should throw ValidationError if login is already taken', async () => {
      mockUserService.findByLogin.mockResolvedValue(mockUser);

      await expect(
        authService.signup({ login: 'testuser', password: 'pass123' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should hash the password before storing', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);
      mockUserService.createWithHash.mockResolvedValue(mockUser);
      const hashSpy = vi
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed' as never);

      await authService.signup({ login: 'testuser', password: 'plaintext' });

      expect(hashSpy).toHaveBeenCalledWith('plaintext', 10);
    });

    it('should assign viewer role by default', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);
      mockUserService.createWithHash.mockResolvedValue({
        ...mockUser,
        role: UserRole.VIEWER,
      });
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      const result = await authService.signup({
        login: 'newuser',
        password: 'pass',
      });

      expect(result.role).toBe(UserRole.VIEWER);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens on valid credentials', async () => {
      mockUserService.findByLogin.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockJwtService.sign
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await authService.login({
        login: 'testuser',
        password: 'pass123',
      });

      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    it('should throw ForbiddenError if user not found', async () => {
      mockUserService.findByLogin.mockResolvedValue(null);

      await expect(
        authService.login({ login: 'nouser', password: 'pass' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError if password does not match', async () => {
      mockUserService.findByLogin.mockResolvedValue(mockUser);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        authService.login({ login: 'testuser', password: 'wrongpass' }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('refresh', () => {
    it('should return new token pair for valid refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        userId: mockUser.id,
        login: mockUser.login,
        role: mockUser.role,
      });
      mockJwtService.sign
        .mockReturnValueOnce('new_access')
        .mockReturnValueOnce('new_refresh');

      const result = await authService.refresh('valid_refresh_token');

      expect(result).toEqual({
        accessToken: 'new_access',
        refreshToken: 'new_refresh',
      });
    });

    it('should throw UnauthorizedError if refreshToken is empty', async () => {
      await expect(authService.refresh('')).rejects.toThrow(UnauthorizedError);
    });

    it('should throw ForbiddenError if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(authService.refresh('bad_token')).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should throw ForbiddenError if refresh token is expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh('expired_token')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
