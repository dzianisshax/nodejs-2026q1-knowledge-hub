import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { InMemoryCategoryRepository } from './repositories/category.in-memory.repository';
import { CATEGORY_REPOSITORY } from './repositories/category.repository.interface';
import { ArticleModule } from '../article/article.module';

@Module({
  imports: [ArticleModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: InMemoryCategoryRepository,
    },
  ],
})
export class CategoryModule {}
