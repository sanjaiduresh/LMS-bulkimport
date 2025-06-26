// redisClient.ts
import { createClient } from 'redis';

const redisUrl = process.env.UPSTASH_REDIS_URL;

if (!redisUrl) {
  throw new Error('❌ Missing UPSTASH_REDIS_URL in environment variables.');
}

// Create Redis client with extended socket timeout and keep-alive
export const redisClient = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 60000, // 15 seconds to connect
    keepAlive: 30000       // Keep TCP connection alive
  }
});

// Log Redis-level errors
redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

// Exported function with retry logic
export async function connectRedisWithRetry(retries = 5) {
  while (retries > 0) {
    try {
      if (!redisClient.isOpen) {
        console.log('🔌 Connecting to Redis...');
        await redisClient.connect();
        console.log('✅ Redis connected');
      }
      break; // connected successfully
    } catch (err: any) {
      console.error(`❌ Redis connection failed: ${err.message}`);
      retries--;
      if (retries === 0) {
        console.error('🚫 Out of retries. Could not connect to Redis.');
        throw err; // Let app crash or handle as needed
      }
      console.log(`🔁 Retrying Redis connection in 3s... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
