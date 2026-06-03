const rateMap = new Map<string, { count: number; reset: number }>()

export function rateLimit(ip: string, limit = 60, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  entry.count++
  if (entry.count > limit) return { ok: false, remaining: 0 }
  return { ok: true, remaining: limit - entry.count }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
