import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

const makeContext = (isPublic = false, hasUser = true): ExecutionContext =>
  ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: hasUser ? { userId: '1', login: 'test', role: 'viewer' } : null,
      }),
    }),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('allows access to public routes without token', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const ctx = makeContext(true, false);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('handleRequest returns user when valid', () => {
    const user = { userId: '1', login: 'test', role: 'viewer' };
    expect(guard.handleRequest(null, user)).toEqual(user);
  });

  it('handleRequest throws UnauthorizedException when no user', () => {
    expect(() => guard.handleRequest(null, null)).toThrow(
      UnauthorizedException,
    );
  });

  it('handleRequest throws UnauthorizedException when error present', () => {
    expect(() => guard.handleRequest(new Error('jwt expired'), null)).toThrow(
      UnauthorizedException,
    );
  });

  it('handleRequest throws UnauthorizedException for malformed token', () => {
    expect(() =>
      guard.handleRequest(new Error('invalid signature'), null),
    ).toThrow(UnauthorizedException);
  });
});
