import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserRepository } from './user.repository.interface';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): User {
    return {
      id: raw.id,
      login: raw.login,
      password: raw.password,
      role: raw.role as UserRole,
      createdAt: raw.createdAt.getTime(),
      updatedAt: raw.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<User[]> {
    return (await this.prisma.user.findMany()).map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { login } });
    return row ? this.toEntity(row) : null;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const hash = await bcrypt.hash(dto.password, 10);
    const row = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hash,
        role: dto.role ?? UserRole.VIEWER,
      },
    });
    return this.toEntity(row);
  }

  async createWithHash(login: string, hash: string): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        login,
        password: hash,
        role: UserRole.VIEWER,
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, dto: UpdatePasswordDto): Promise<User> {
    const hash = await bcrypt.hash(dto.newPassword, 10);
    const row = await this.prisma.user.update({
      where: { id },
      data: { password: hash },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
