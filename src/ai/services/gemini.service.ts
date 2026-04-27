import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';

interface GeminiResponseBody {
  candidates: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason: string;
  }>;
  usageMetadata?: { totalTokenCount?: number };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly maxRetries = 3;

  private get baseUrl(): string {
    return (
      process.env.GEMINI_API_BASE_URL ??
      'https://generativelanguage.googleapis.com'
    );
  }

  private get model(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  private get apiKey(): string {
    return process.env.GEMINI_API_KEY ?? '';
  }

  async generate(
    prompt: string,
  ): Promise<{ text: string; tokens: number; latencyMs: number }> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });

    let attempt = 0;
    const started = Date.now();

    while (attempt < this.maxRetries) {
      let response: Response;

      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(30_000),
        });
      } catch (err) {
        const isTimeout =
          err instanceof DOMException && err.name === 'TimeoutError';

        this.logger.warn(
          `Gemini request failed on attempt ${attempt + 1}: ${isTimeout ? 'timeout' : String(err)}`,
        );
        attempt++;
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        this.logger.error('Gemini API authentication error');
        throw new InternalServerErrorException(
          'AI service configuration error',
        );
      }

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.warn(
          `Gemini upstream rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1})`,
        );
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }

      if (!response.ok) {
        this.logger.warn(
          `Gemini responded with status ${response.status} on attempt ${attempt + 1}`,
        );
        attempt++;
        continue;
      }

      const data = (await response.json()) as GeminiResponseBody;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const tokens = data.usageMetadata?.totalTokenCount ?? 0;
      const latencyMs = Date.now() - started;

      return { text, tokens, latencyMs };
    }

    this.logger.error(`Gemini failed after ${this.maxRetries} attempts`);
    throw new ServiceUnavailableException(
      'AI service is temporarily unavailable',
    );
  }

  parseJson<T>(text: string): T | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;
      return JSON.parse(jsonMatch[0]) as T;
    } catch {
      return null;
    }
  }
}
