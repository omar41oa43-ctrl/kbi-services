/**
 * Simple in-memory rate limiter for API routes
 * Limits requests per IP address within a time window
 */

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

export function rateLimit(
    identifier: string,
    config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { success: boolean; remaining: number; resetIn: number } {
    const now = Date.now()
    const entry = rateLimitStore.get(identifier)

    // Clean up expired entries periodically
    if (rateLimitStore.size > 10000) {
        for (const [key, value] of rateLimitStore.entries()) {
            if (now > value.resetTime) {
                rateLimitStore.delete(key)
            }
        }
    }

    if (!entry || now > entry.resetTime) {
        rateLimitStore.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        })
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetIn: config.windowMs
        }
    }

    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetIn: entry.resetTime - now
        }
    }

    entry.count++
    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now
    }
}

export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    return request.headers.get("x-real-ip") || "unknown"
}
