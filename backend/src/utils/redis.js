import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

let redisClient = null;
let isRedisReady = false;

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not configured. Redis caching will be disabled.');
    return null;
  }

  try {
    const client = createClient({
      url: process.env.REDIS_URL
    });

    client.on('error', (err) => {
      // Suppress repetitive reconnect noise when Redis is not running
      if (!isRedisReady && err.message?.includes('connect') || err.message?.includes('ECONNREFUSED')) {
        // Only log once per failure cycle
      } else {
        console.warn('Redis Client Error:', err.message);
      }
      isRedisReady = false;
    });

    client.on('connect', () => {
      console.log('Redis connected successfully.');
    });

    client.on('ready', () => {
      isRedisReady = true;
    });

    await client.connect();
    redisClient = client;
    return redisClient;
  } catch (err) {
    console.warn('Failed to initialize Redis Client:', err.message);
    redisClient = null;
    isRedisReady = false;
    return null;
  }
};

// Immediately invoke to start connection
initRedis();

export const getCache = async (key) => {
  if (!redisClient || !isRedisReady) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn('Error reading from cache:', err.message);
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  if (!redisClient || !isRedisReady) return false;
  try {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds
    });
    return true;
  } catch (err) {
    console.warn('Error writing to cache:', err.message);
    return false;
  }
};

export const delCachePattern = async (pattern) => {
  if (!redisClient || !isRedisReady) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
    }
    return true;
  } catch (err) {
    console.warn('Error clearing cache pattern:', err.message);
    return false;
  }
};

export default {
  getCache,
  setCache,
  delCachePattern
};
