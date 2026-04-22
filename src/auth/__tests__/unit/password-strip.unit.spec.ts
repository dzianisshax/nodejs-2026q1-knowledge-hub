import { describe, it, expect } from 'vitest';
import { UserRole } from '../../../user/entities/user.entity';

// Simulates what a response interceptor or response DTO should do
function stripPassword(user: Record<string, any>) {
  const { password: _password, ...rest } = user;
  return rest;
}

describe('Password stripping from User response', () => {
  const rawUser = {
    id: 'uuid-1',
    login: 'alice',
    password: '$2a$10$hashedpassword',
    role: UserRole.VIEWER,
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('removes password field from user object', () => {
    const result = stripPassword(rawUser);
    expect(result).not.toHaveProperty('password');
  });

  it('retains all other user fields', () => {
    const result = stripPassword(rawUser);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('login');
    expect(result).toHaveProperty('role');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('createdAt');
    expect(result).toHaveProperty('updatedAt');
  });

  it('does not mutate the original object', () => {
    stripPassword(rawUser);
    expect(rawUser).toHaveProperty('password');
  });
});
