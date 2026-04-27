import { Injectable } from '@nestjs/common';

export interface EndpointMetrics {
  requests: number;
  totalTokens: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  errors: number;
}

@Injectable()
export class AiUsageService {
  private readonly startedAt = new Date();
  private totalRequests = 0;
  private totalTokens = 0;
  private totalErrors = 0;
  private readonly byEndpoint = new Map<string, EndpointMetrics>();
  private readonly latencies: number[] = []; // for percentile calculation

  track(endpoint: string, tokens = 0, latencyMs = 0, isError = false): void {
    this.totalRequests++;
    this.totalTokens += tokens;
    if (isError) this.totalErrors++;

    if (latencyMs > 0) this.latencies.push(latencyMs);

    const existing = this.byEndpoint.get(endpoint) ?? {
      requests: 0,
      totalTokens: 0,
      totalLatencyMs: 0,
      avgLatencyMs: 0,
      errors: 0,
    };

    existing.requests++;
    existing.totalTokens += tokens;
    existing.totalLatencyMs += latencyMs;
    existing.avgLatencyMs =
      latencyMs > 0
        ? Math.round(existing.totalLatencyMs / existing.requests)
        : existing.avgLatencyMs;
    if (isError) existing.errors++;

    this.byEndpoint.set(endpoint, existing);
  }

  private percentile(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
  }

  getStats() {
    const byEndpoint: Record<string, EndpointMetrics> = {};
    for (const [key, val] of this.byEndpoint) {
      byEndpoint[key] = { ...val };
    }

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt.getTime()) / 1000),
      startedAt: this.startedAt.toISOString(),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate:
        this.totalRequests === 0
          ? 0
          : Number((this.totalErrors / this.totalRequests).toFixed(3)),
      totalTokens: this.totalTokens,
      latency: {
        p50Ms: this.percentile(50),
        p90Ms: this.percentile(90),
        p99Ms: this.percentile(99),
        avgMs:
          this.latencies.length === 0
            ? 0
            : Math.round(
                this.latencies.reduce((a, b) => a + b, 0) /
                  this.latencies.length,
              ),
      },
      byEndpoint,
    };
  }
}
