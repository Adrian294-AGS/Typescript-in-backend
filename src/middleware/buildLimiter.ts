import { buildRateLimiter } from "../config/rateLimiter.js";
import redis from "../config/redisCon.js";
import { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

export const globalLimiter = buildRateLimiter({
    redisClient: redis,
    windowMs: 60_000,
    max: 300,
    keyPrefix: "global",
});

export const loginLimiter = buildRateLimiter({
    redisClient: redis,
    windowMs: 15 * 60_000,
    max: 5,
    keyPrefix: "login"
});

export const perUserLimiter = buildRateLimiter({
    redisClient: redis,
    windowMs: 60_000,
    max: 60,
    keyGenerator: (req: Request) => (req as any).user?.UID ?? ipKeyGenerator(req.ip ?? "unknown"),
    keyPrefix: "user"
});