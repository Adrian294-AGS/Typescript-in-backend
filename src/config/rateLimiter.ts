import type { Request } from "express";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { Redis } from "ioredis";
import type { Options } from "express-rate-limit";

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