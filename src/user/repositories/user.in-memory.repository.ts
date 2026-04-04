import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from './user.repository.interface';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly users: Map<string, User> = new Map();

  findAll(): User[] {
    return Array.from(this.users.values());
  }

  findById(id: string): User | null {
    return this.users.get(id) ?? null;
  }

  create(dto: CreateUserDto): User {
    const now = Date.now();
    const user: User = {
      id: uuidv4(),
      login: dto.login,
      password: dto.password,
      role: dto.role ?? 'viewer',
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    return user;
  }

  update(id: string, dto: UpdatePasswordDto): User {
    const user = this.users.get(id)!;
    const updated: User = {
      ...user,
      password: dto.newPassword,
      updatedAt: Date.now(),
    };

    this.users.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.users.delete(id);
  }
}
