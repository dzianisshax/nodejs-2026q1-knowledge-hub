import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ArticleModule } from './article/article.module';
import { CategoryModule } from './category/category.module';
import { CommentModule } from './comment/comment.module';
import { AiModule } from './ai/ai.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { RagModule } from './ai/rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // makes process.env available everywhere before other modules init
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ArticleModule,
    CategoryModule,
    CommentModule,
    AiModule,
    RagModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
