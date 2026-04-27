import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AiRateLimitGuard.name);
  private readonly requests = new Map<string, number[]>();

  private get rpm(): number {
    return parseInt(process.env.AI_RATE_LIMIT_RPM ?? '20', 10);
  }

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const windowStart = now - windowMs;

    const timestamps = (this.requests.get(ip) ?? []).filter(
      (t) => t > windowStart,
    );
    timestamps.push(now);
    this.requests.set(ip, timestamps);

    if (timestamps.length > this.rpm) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      this.logger.warn(`Rate limit exceeded for IP ${ip}`);
      throw new HttpException(
        {
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Retry after ${retryAfter}s.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
