import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Configuration for resilience
const redisConfig = {
  maxRetriesPerRequest: 1, // Minimize retries if failing to avoid memory pressure
  retryStrategy: (times: number) => {
    // Stop retrying after 3 attempts if it's a sandbox/missing env
    if (times > 3) return null;
    return Math.min(times * 100, 2000);
  },
  connectTimeout: 5000,
};

let redisInstance: Redis | null = null;
let isRedisAvailable = false;

try {
  redisInstance = new Redis(redisUrl, redisConfig);
  
  redisInstance.on('error', (err) => {
    if (isRedisAvailable) {
      console.warn('Redis connection lost:', err.message);
      isRedisAvailable = false;
    }
  });

  redisInstance.on('connect', () => {
    console.log('Successfully connected to Redis');
    isRedisAvailable = true;
  });

  // Periodic active state health-check ping (every 30 seconds)
  setInterval(async () => {
    if (redisInstance && redisInstance.status === 'ready') {
      try {
        const pingRes = await redisInstance.ping();
        isRedisAvailable = pingRes === 'PONG';
      } catch {
        isRedisAvailable = false;
      }
    } else {
      isRedisAvailable = false;
    }
  }, 30000);
} catch (e) {
  console.error('Failed to initialize Redis client:', e);
}

// Inline connection validation checking status strictly
function checkRedisReady(): boolean {
  return !!redisInstance && redisInstance.status === 'ready' && isRedisAvailable;
}

// Export a proxy-like object or helpers that handle missing redis
export const redis = {
  get: async (key: string) => {
    if (!checkRedisReady()) return null;
    try {
      return await redisInstance!.get(key);
    } catch {
      isRedisAvailable = false; // Set to false on failure
      return null;
    }
  },
  set: async (key: string, value: string, mode?: string, duration?: number) => {
    if (!checkRedisReady()) return null;
    try {
      if (mode === 'EX' && duration) {
        return await redisInstance!.set(key, value, 'EX', duration);
      }
      return await redisInstance!.set(key, value);
    } catch {
      isRedisAvailable = false;
      return null;
    }
  },
  keys: async (pattern: string) => {
    if (!checkRedisReady()) return [];
    try {
      return await redisInstance!.keys(pattern);
    } catch {
      isRedisAvailable = false;
      return [];
    }
  },
  del: async (key: string) => {
    if (!checkRedisReady()) return 0;
    try {
      return await redisInstance!.del(key);
    } catch {
      isRedisAvailable = false;
      return 0;
    }
  },
  ttl: async (key: string) => {
    if (!checkRedisReady()) return -1;
    try {
      return await redisInstance!.ttl(key);
    } catch {
      isRedisAvailable = false;
      return -1;
    }
  }
};
