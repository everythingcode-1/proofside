type Bucket = { count: number; resetsAt: number }

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>()
  return (key: string, now = Date.now()) => {
    const current = buckets.get(key)
    const bucket = !current || now >= current.resetsAt ? { count: 0, resetsAt: now + windowMs } : current
    bucket.count += 1
    buckets.set(key, bucket)
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetsAt: bucket.resetsAt }
  }
}
