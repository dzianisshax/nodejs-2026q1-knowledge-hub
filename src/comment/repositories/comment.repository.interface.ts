import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface ICommentRepository {
  findAllByArticleId(articleId: string): Promise<Comment[]>;
  findById(id: string): Promise<Comment | null>;
  create(dto: CreateCommentDto): Promise<Comment>;
  delete(id: string): Promise<void>;
  deleteByArticleId(articleId: string): Promise<void>;
  deleteByAuthorId(authorId: string): Promise<void>;
}
