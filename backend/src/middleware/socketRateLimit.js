/**
 * Socket.IO Rate Limiter
 * 
 * Prevents event flooding / DoS attacks on Socket.IO connections
 */

class SocketRateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 1000;        // Time window (1 second)
        this.maxRequests = options.maxRequests || 10;    // Max events per window
        this.blockDurationMs = options.blockDurationMs || 30000; // Block for 30 seconds

        this.clients = new Map(); // userId -> { count, windowStart, blockedUntil }
    }

    /**
     * Check if user is rate limited
     * @param {string} userId - The user ID
     * @returns {boolean} - true if allowed, false if blocked
     */
    isAllowed(userId) {
        const now = Date.now();
        let client = this.clients.get(userId);

        if (!client) {
            client = { count: 0, windowStart: now, blockedUntil: 0 };
            this.clients.set(userId, client);
        }

        // Check if blocked
        if (client.blockedUntil > now) {
            return false;
        }

        // Reset window if expired
        if (now - client.windowStart > this.windowMs) {
            client.count = 0;
            client.windowStart = now;
        }

        // Increment count
        client.count++;

        // Check limit
        if (client.count > this.maxRequests) {
            client.blockedUntil = now + this.blockDurationMs;
            console.warn(`[RATE-LIMIT] User ${userId} blocked for event flooding`);
            return false;
        }

        return true;
    }

    /**
     * Get remaining time until unblocked (in seconds)
     * @param {string} userId 
     * @returns {number} - Seconds until unblocked, 0 if not blocked
     */
    getBlockedTimeRemaining(userId) {
        const client = this.clients.get(userId);
        if (!client) return 0;

        const remaining = client.blockedUntil - Date.now();
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    /**
     * Create Socket.IO middleware for rate limiting
     */
    middleware() {
        return (socket, next) => {
            const userId = socket.user?.id;
            if (!userId) return next();

            // Intercept all events
            const originalEmit = socket.emit;
            const limiter = this;

            socket.onAny((eventName, ...args) => {
                // Skip internal events
                if (eventName.startsWith('$')) return;

                if (!limiter.isAllowed(userId)) {
                    const remaining = limiter.getBlockedTimeRemaining(userId);
                    socket.emit('error', {
                        message: `Rate limit exceeded. Try again in ${remaining} seconds.`,
                        code: 'RATE_LIMITED'
                    });
                    return;
                }
            });

            next();
        };
    }

    /**
     * Cleanup old entries (call periodically)
     */
    cleanup() {
        const now = Date.now();
        const cleanupThreshold = 5 * 60 * 1000; // 5 minutes

        for (const [userId, client] of this.clients.entries()) {
            if (now - client.windowStart > cleanupThreshold && client.blockedUntil < now) {
                this.clients.delete(userId);
            }
        }
    }
}

// Singleton instance with default config
const socketRateLimiter = new SocketRateLimiter({
    windowMs: 1000,          // 1 second window
    maxRequests: 15,         // 15 events per second max
    blockDurationMs: 30000,  // Block for 30 seconds if exceeded
});

// Cleanup every 5 minutes
setInterval(() => socketRateLimiter.cleanup(), 5 * 60 * 1000);

module.exports = socketRateLimiter;
