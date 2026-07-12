import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import type { Options } from "express-rate-limit";

/**
 * express-rate-limit is the standard choice for Express apps (41M+ weekly
 * downloads, by far the most used rate limiting middleware in the Node
 * ecosystem). It's a fixed-window algorithm by default — simple, fast,
 * good enough for the vast majority of APIs.
 *
 * By itself it only limits per-process (in-memory store). The moment you
 * run more than one instance behind a load balancer, you need a shared
 * store — that's what RedisStore below provides.
 *
 * Note on algorithm: fixed window can allow up to 2x the limit right at
 * window boundaries. For 99% of use cases (general API protection, login
 * throttling) this doesn't matter. If you need precise sliding-window
 * accuracy for something like a metered billing API, that's the case
 * where rate-limiter-flexible earns its place instead.
 */

interface BuildLimiterOptions {
  redisClient: Redis;
  windowMs: number;
  max: number;
  keyPrefix: string; // separates counters for different limiters sharing one Redis
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export function buildRateLimiter(options: BuildLimiterOptions) {
  const {
    redisClient,
    windowMs,
    max,
    keyPrefix,
    keyGenerator,
    message = "Too many requests, please try again later.",
  } = options;

  const config: Partial<Options> = {
    windowMs,
    max,
    standardHeaders: true, // adds RateLimit-* headers (draft-7 IETF standard)
    legacyHeaders: false, // disables the older X-RateLimit-* headers
    message: { error: message },
    store: new RedisStore({
      // ioredis's call signature matches what rate-limit-redis expects
      // cast call to a variadic-any function to avoid tuple/spread type error
      sendCommand: (...args: any[]) => (redisClient.call as (...a: any[]) => any)(...args),
      prefix: `rl:${keyPrefix}:`,
    }),
  };

  if (keyGenerator) {
    config.keyGenerator = keyGenerator;
  }

  return rateLimit(config);
}