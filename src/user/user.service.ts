import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  findAll(): User[] {
    return this.userRepository.findAll();
  }

  findOne(id: string): User | null {
    return this.userRepository.findById(id);
  }

  create(dto: CreateUserDto): User {
    return this.userRepository.create(dto);
  }

  update(id: string, dto: UpdatePasswordDto): User {
    return this.userRepository.update(id, dto);
  }

  delete(id: string): void {
    this.userRepository.delete(id);
  }
}
