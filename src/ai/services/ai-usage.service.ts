import { Injectable } from '@nestjs/common';

export interface UsageStats {
  totalRequests: number;
  byEndpoint: Record<string, number>;
  totalTokens: number;
  latencyMs: { total: number; count: number; avg: number };
}

@Injectable()
export class AiUsageService {
  private stats: UsageStats = {
    totalRequests: 0,
    byEndpoint: {},
    totalTokens: 0,
    latencyMs: { total: 0, count: 0, avg: 0 },
  };

  track(endpoint: string, tokens = 0, latencyMs = 0): void {
    this.stats.totalRequests++;
    this.stats.byEndpoint[endpoint] =
      (this.stats.byEndpoint[endpoint] ?? 0) + 1;
    this.stats.totalTokens += tokens;
    this.stats.latencyMs.total += latencyMs;
    this.stats.latencyMs.count++;
    this.stats.latencyMs.avg = Math.round(
      this.stats.latencyMs.total / this.stats.latencyMs.count,
    );
  }

  getStats(): UsageStats {
    return { ...this.stats, byEndpoint: { ...this.stats.byEndpoint } };
  }
}
