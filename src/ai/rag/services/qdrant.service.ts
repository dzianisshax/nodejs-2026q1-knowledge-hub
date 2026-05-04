import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorMetadata {
  articleId: string;
  articleTitle: string;
  chunkIndex: number;
  chunkText: string;
  status: string;
  categoryId: string | null;
  tags: string[];
}

export interface SearchHit {
  articleId: string;
  articleTitle: string;
  chunk: string;
  similarity: number;
}

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client: QdrantClient;
  private readonly vectorSize = 768; // text-embedding-004 output dimension

  constructor() {
    this.client = new QdrantClient({
      url: process.env.RAG_VECTOR_DB_URL ?? 'http://localhost:6333',
    });
  }

  private get collection(): string {
    return process.env.RAG_VECTOR_COLLECTION ?? 'knowledge_hub_articles';
  }

  async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collection,
      );

      if (!exists) {
        await this.client.createCollection(this.collection, {
          vectors: { size: this.vectorSize, distance: 'Cosine' },
        });
        this.logger.log(`Created Qdrant collection: ${this.collection}`);
      }
    } catch (err) {
      this.logger.error(`Qdrant ensureCollection error: ${String(err)}`);
      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async upsertVectors(
    points: Array<{ id: string; vector: number[]; payload: VectorMetadata }>,
  ): Promise<void> {
    try {
      await this.client.upsert(this.collection, {
        wait: true,
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload as unknown as Record<string, unknown>,
        })),
      });
    } catch (err) {
      this.logger.error(`Qdrant upsert error: ${String(err)}`);
      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    try {
      const existing = await this.client.scroll(this.collection, {
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
        limit: 1,
      });

      if (existing.points.length === 0) return 0;

      await this.client.delete(this.collection, {
        wait: true,
        filter: { must: [{ key: 'articleId', match: { value: articleId } }] },
      });

      return existing.points.length;
    } catch (err) {
      this.logger.error(`Qdrant delete error: ${String(err)}`);
      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }

  async search(
    vector: number[],
    limit: number,
    filter?: {
      articleStatus?: string;
      categoryId?: string;
      tags?: string[];
    },
  ): Promise<SearchHit[]> {
    try {
      const must: object[] = [];

      if (filter?.articleStatus) {
        must.push({ key: 'status', match: { value: filter.articleStatus } });
      }
      if (filter?.categoryId) {
        must.push({ key: 'categoryId', match: { value: filter.categoryId } });
      }
      if (filter?.tags?.length) {
        for (const tag of filter.tags) {
          must.push({ key: 'tags', match: { value: tag } });
        }
      }

      const results = await this.client.search(this.collection, {
        vector,
        limit,
        with_payload: true,
        ...(must.length > 0 ? { filter: { must } } : {}),
      });

      return results.map((r) => {
        const payload = r.payload as unknown as VectorMetadata;
        return {
          articleId: payload.articleId,
          articleTitle: payload.articleTitle,
          chunk: payload.chunkText,
          similarity: r.score,
        };
      });
    } catch (err) {
      this.logger.error(`Qdrant search error: ${String(err)}`);
      throw new ServiceUnavailableException('Vector DB is unavailable');
    }
  }
}
