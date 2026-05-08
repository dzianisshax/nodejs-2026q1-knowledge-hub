import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkerService } from './services/chunker.service';
import { RagConversationService } from './services/rag-conversation.service';
import { GeminiService } from '../services/gemini.service';
import { ArticleService } from '../../article/article.service';
import { RAG_PROMPTS } from './prompts/rag.prompts';
import { ReindexDto } from './dto/reindex.dto';
import { RagSearchDto } from './dto/rag-search.dto';
import { RagChatDto } from './dto/rag-chat.dto';
import { ArticleStatus, Article } from '../../article/entities/article.entity';

const RAG_PAGE_SIZE = 1000;

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly qdrant: QdrantService,
    private readonly embedding: EmbeddingService,
    private readonly chunker: ChunkerService,
    private readonly conversation: RagConversationService,
    private readonly gemini: GeminiService,
    private readonly articleService: ArticleService,
  ) {}

  private async fetchArticles(dto: ReindexDto): Promise<Article[]> {
    const filters =
      dto.onlyPublished !== false ? { status: ArticleStatus.PUBLISHED } : {};

    const paginated = await this.articleService.findAll(
      filters,
      1,
      RAG_PAGE_SIZE,
    );
    let articles = paginated.data;

    if (dto.articleIds?.length) {
      const idSet = new Set(dto.articleIds);
      articles = articles.filter((a) => idSet.has(a.id));
    }

    return articles;
  }

  private async indexArticle(article: Article): Promise<number> {
    // Always delete existing vectors first — prevents stale chunks after content edits
    await this.qdrant.deleteByArticleId(article.id);

    const fullText = `${article.title}\n\n${article.content}`;
    const chunks = this.chunker.chunk(fullText);

    if (chunks.length === 0) {
      this.logger.warn(
        `Article "${article.title}" produced 0 chunks — skipping`,
      );
      return 0;
    }

    const vectors = await this.embedding.embedBatch(chunks.map((c) => c.text));

    const points = chunks.map((chunk, i) => ({
      id: uuidv4(),
      vector: vectors[i],
      payload: {
        articleId: article.id,
        articleTitle: article.title,
        chunkIndex: chunk.index,
        chunkText: chunk.text,
        status: article.status,
        categoryId: article.categoryId ?? null,
        tags: article.tags ?? [],
      },
    }));

    await this.qdrant.upsertVectors(points);

    this.logger.log(
      `Indexed article "${article.title}" (${article.id}) — ${chunks.length} chunk(s)`,
    );

    return chunks.length;
  }

  async reindex(dto: ReindexDto) {
    await this.qdrant.ensureCollection();

    const articles = await this.fetchArticles(dto);
    let totalChunks = 0;

    for (const article of articles) {
      try {
        totalChunks += await this.indexArticle(article);
      } catch (err) {
        // Log and continue — one failing article should not abort full reindex
        this.logger.error(
          `Failed to index article ${article.id}: ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Reindex complete: ${articles.length} articles, ${totalChunks} chunks`,
    );

    return {
      indexedArticles: articles.length,
      indexedChunks: totalChunks,
      vectorCollection:
        process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles',
    };
  }

  async search(dto: RagSearchDto) {
    await this.qdrant.ensureCollection();

    let queryVector: number[];
    try {
      queryVector = await this.embedding.embed(dto.query);
    } catch (err) {
      this.logger.error(`Embedding failed for search query: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Embedding service temporarily unavailable',
      );
    }

    const results = await this.qdrant.search(queryVector, dto.limit ?? 5, {
      articleStatus: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    return { results };
  }

  async chat(dto: RagChatDto) {
    await this.qdrant.ensureCollection();

    const conversationId = dto.conversationId ?? uuidv4();
    const history = this.conversation.getHistory(conversationId);

    let queryVector: number[];
    try {
      queryVector = await this.embedding.embed(dto.question);
    } catch (err) {
      this.logger.error(`Embedding failed for chat question: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Embedding service temporarily unavailable',
      );
    }

    const hits = await this.qdrant.search(queryVector, 5);

    if (hits.length === 0) {
      const answer =
        "I don't have enough information in the knowledge base to answer that.";
      this.conversation.append(conversationId, 'user', dto.question);
      this.conversation.append(conversationId, 'assistant', answer);
      return { answer, sources: [], conversationId };
    }

    const prompt = RAG_PROMPTS.chat(dto.question, hits, history);

    let geminiResult: { text: string; tokens: number; latencyMs: number };
    try {
      geminiResult = await this.gemini.generate(prompt);
    } catch (err) {
      this.logger.error(`Gemini generation failed in RAG chat: ${String(err)}`);
      throw new ServiceUnavailableException(
        'AI generation service temporarily unavailable',
      );
    }

    const answer = geminiResult.text.trim();

    this.conversation.append(conversationId, 'user', dto.question);
    this.conversation.append(conversationId, 'assistant', answer);

    this.logger.log(
      `RAG chat: conversationId=${conversationId} hits=${hits.length} latency=${geminiResult.latencyMs}ms`,
    );

    return {
      answer,
      sources: hits.map((h) => ({
        articleId: h.articleId,
        articleTitle: h.articleTitle,
        relevantChunk: h.chunk,
      })),
      conversationId,
    };
  }

  async deleteArticleFromIndex(articleId: string): Promise<void> {
    const deleted = await this.qdrant.deleteByArticleId(articleId);
    if (deleted === 0) {
      throw new NotFoundException(
        `No index entries found for articleId=${articleId}`,
      );
    }
    this.logger.log(
      `Removed ${deleted} vector(s) for articleId=${articleId} from index`,
    );
  }

  getConversationHistory(conversationId: string) {
    if (!this.conversation.exists(conversationId)) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    return {
      conversationId,
      messages: this.conversation.getHistory(conversationId),
    };
  }

  getConversationStats() {
    return this.conversation.stats();
  }
}
