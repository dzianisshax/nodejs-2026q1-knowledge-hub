import { Module } from '@nestjs/common';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkerService } from './services/chunker.service';
import { RagConversationService } from './services/rag-conversation.service';
import { RerankerService } from './services/reranker.service';
import { ArticleModule } from '../../article/article.module';
import { AiModule } from '../ai.module';

@Module({
  imports: [ArticleModule, AiModule],
  controllers: [RagController],
  providers: [
    RagService,
    QdrantService,
    EmbeddingService,
    ChunkerService,
    RagConversationService,
    RerankerService,
  ],
})
export class RagModule {}
