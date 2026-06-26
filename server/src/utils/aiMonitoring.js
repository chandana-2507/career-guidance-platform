/**
 * Structured monitoring logs for AI cache and request lifecycle.
 */
export function logAiCacheHit(agentId, { userId, cacheType, detail = {} }) {
  console.info(
    `[AI:${agentId}]`,
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'cache_hit',
      agent: agentId,
      cacheType,
      userId: userId ? String(userId) : undefined,
      ...detail,
    }),
  );
}

export function logAiCacheMiss(agentId, { userId, cacheType, reason }) {
  console.info(
    `[AI:${agentId}]`,
    JSON.stringify({
      ts: new Date().toISOString(),
      event: 'cache_miss',
      agent: agentId,
      cacheType,
      userId: userId ? String(userId) : undefined,
      reason,
    }),
  );
}
