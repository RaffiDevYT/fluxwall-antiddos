import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisDb = parseInt(process.env.REDIS_DB || "0", 10);

declare global {
  // eslint-disable-next-line no-var
  var redisClientInstance: Redis | undefined;
}

export function getRedisClient(): Redis {
  if (!global.redisClientInstance) {
    global.redisClientInstance = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      db: redisDb,
      connectTimeout: 2000,
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        return Math.min(times * 100, 2000);
      },
      lazyConnect: false,
    });

    global.redisClientInstance.on("error", (err) => {
      console.error("[Redis Error]", err.message);
    });
  }

  return global.redisClientInstance;
}

export default getRedisClient;
