import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const redis = getRedis();
  if (!redis) {
    res.status(200).json({ available: false, count: null });
    return;
  }

  const { jobKey, personId, shouldIncrement } = req.body || {};
  if (!jobKey) {
    res.status(400).json({ error: 'Missing jobKey' });
    return;
  }

  try {
    let alreadySeen = false;
    if (shouldIncrement && personId) {
      const seenKey = 'seen:' + jobKey + ':' + personId;
      alreadySeen = !!(await redis.get(seenKey));
      if (!alreadySeen) {
        await redis.set(seenKey, '1');
      }
    }

    let count;
    if (shouldIncrement && !alreadySeen) {
      count = await redis.incr('count:' + jobKey);
    } else {
      count = Number(await redis.get('count:' + jobKey)) || 0;
    }

    res.status(200).json({ available: true, count });
  } catch (err) {
    res.status(200).json({ available: false, count: null });
  }
}
