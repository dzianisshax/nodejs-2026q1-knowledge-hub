import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findAll(): User[];
  findById(id: string): User | null;
  create(dto: CreateUserDto): User;
  update(id: string, dto: UpdatePasswordDto): User;
  delete(id: string): void;
}
