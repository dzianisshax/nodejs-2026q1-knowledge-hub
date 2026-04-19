import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { InMemoryUserRepository } from './repositories/user.in-memory.repository';
import { USER_REPOSITORY } from './repositories/user.repository.interface';
import { ArticleModule } from '../article/article.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [ArticleModule, CommentModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository,
    },
  ],
})
export class UserModule {}
