import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { InMemoryUserRepository } from './repositories/user.in-memory.repository';
import { USER_REPOSITORY } from './repositories/user.repository.interface';

@Module({
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
