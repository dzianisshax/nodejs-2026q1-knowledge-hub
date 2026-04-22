import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../guards/roles.guard';
import { UserRole } from '../../../user/entities/user.entity';

const makeContext = (role: UserRole, method = 'GET'): ExecutionContext =>
  ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: '1', login: 'test', role },
        method,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles metadata is set', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(makeContext(UserRole.VIEWER))).toBe(true);
  });

  it('allows admin full access regardless of method', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);
    expect(guard.canActivate(makeContext(UserRole.ADMIN, 'DELETE'))).toBe(true);
  });

  it('allows viewer GET requests', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIEWER]);
    expect(guard.canActivate(makeContext(UserRole.VIEWER, 'GET'))).toBe(true);
  });

  it('throws ForbiddenException for viewer POST', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.VIEWER]);
    expect(() =>
      guard.canActivate(makeContext(UserRole.VIEWER, 'POST')),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException for viewer DELETE', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(makeContext(UserRole.VIEWER, 'DELETE')),
    ).toThrow(ForbiddenException);
  });

  it('allows editor GET requests', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);
    expect(guard.canActivate(makeContext(UserRole.EDITOR, 'GET'))).toBe(true);
  });

  it('allows editor POST requests', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);
    expect(guard.canActivate(makeContext(UserRole.EDITOR, 'POST'))).toBe(true);
  });

  it('allows editor PUT requests', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.EDITOR]);
    expect(guard.canActivate(makeContext(UserRole.EDITOR, 'PUT'))).toBe(true);
  });

  it('throws ForbiddenException for editor DELETE', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(makeContext(UserRole.EDITOR, 'DELETE')),
    ).toThrow(ForbiddenException);
  });
});
