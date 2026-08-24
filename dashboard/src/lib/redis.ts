import Redis from "ioredis";

const isProd = process.env.NODE_ENV === "production";
const redisHost = process.env.REDIS_HOST || (isProd ? "redis" : "localhost");
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
      connectTimeout: 1000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy(times) {
        if (times > 3) return null; // stop spamming if offline in dev
        return 2000;
      },
      lazyConnect: true,
    });

    global.redisClientInstance.on("error", (err) => {
      // quiet log in local dev if Redis container not running
    });
  }

  return global.redisClientInstance;
}

export default getRedisClient;
