import { Redis } from "ioredis";

const host = process.env['REDIS_HOST'];
const port = Number(process.env["REDIS_PORT"]);

const redis = new Redis({
  host: host,
  port: port,
});

redis.on("connect", () => {
  console.log("Redis Connected......");
});

redis.on("error", (err: Error) => {
  console.error("Redis error:", err);
});

export default redis;
