import { Injectable } from '@nestjs/common';
import { UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IUserRepository } from './user.repository.interface';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(raw: any): User {
    return {
      id: raw.id,
      login: raw.login,
      password: raw.password,
      role: raw.role.toLowerCase() as UserRole,
      createdAt: raw.createdAt.getTime(),
      updatedAt: raw.updatedAt.getTime(),
    };
  }

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany();
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toEntity(row) : null;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: dto.password,
        role: (dto.role?.toUpperCase() ?? 'VIEWER') as PrismaUserRole,
      },
    });
    return this.toEntity(row);
  }

  async update(id: string, dto: UpdatePasswordDto): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        password: dto.newPassword,
        version: { increment: 1 },
      },
    });
    return this.toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
