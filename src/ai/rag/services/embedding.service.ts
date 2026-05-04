import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';

interface EmbedResponse {
  embedding: { values: number[] };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  private get baseUrl(): string {
    return (
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com'
    );
  }

  private get model(): string {
    return process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2';
  }

  private get apiKey(): string {
    return process.env.GEMINI_API_KEY ?? '';
  }

  async embed(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      this.logger.error(`Embedding network error: ${String(err)}`);
      throw new ServiceUnavailableException(
        'Embedding service temporarily unavailable',
      );
    }

    if (response.status === 401 || response.status === 403) {
      this.logger.error('Gemini embedding auth error');
      throw new InternalServerErrorException('AI service configuration error');
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Embedding API error: (${response.status}) ${errorText}`);

      throw new ServiceUnavailableException(
        'Embedding service temporarily unavailable',
      );
    }

    const data = (await response.json()) as EmbedResponse;
    return data.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}
