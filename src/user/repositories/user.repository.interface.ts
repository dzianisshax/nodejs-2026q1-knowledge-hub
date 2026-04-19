import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  createWithHash(login: string, hash: string): Promise<User>;
  update(id: string, dto: UpdatePasswordDto): Promise<User>;
  delete(id: string): Promise<void>;
}
