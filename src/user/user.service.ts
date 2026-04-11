import { Inject, Injectable } from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from './repositories/user.repository.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { User } from './entities/user.entity';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { paginate } from '../common/helpers/paginate.helper';
import { ArticleService } from '../article/article.service';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly articleService: ArticleService,
    private readonly commentService: CommentService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResponseDto<User>> {
    return paginate(await this.userRepository.findAll(), page, limit);
  }

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create(dto);
  }

  async update(id: string, dto: UpdatePasswordDto): Promise<User> {
    return this.userRepository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.articleService.nullifyAuthorId(id);
    await this.commentService.removeByAuthorId(id);
    await this.userRepository.delete(id);
  }
}
