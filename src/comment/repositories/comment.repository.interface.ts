import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface ICommentRepository {
  findAllByArticleId(articleId: string): Comment[];
  findById(id: string): Comment | null;
  create(dto: CreateCommentDto): Comment;
  delete(id: string): void;
  deleteByArticleId(articleId: string): void;
  deleteByAuthorId(authorId: string): void;
}
