/**
 * JWT Configuration
 * 
 * SECURITY: No default secrets - app will fail at startup if not configured
 * This prevents accidental deployment with weak/known secrets
 */

// Validate secrets exist (will be checked by config/validator.js at startup)
const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || !refreshSecret) {
    console.error('❌ FATAL: JWT secrets not configured. Set JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
    // Don't exit here - let validator.js handle it for comprehensive error reporting
}

module.exports = {
    accessToken: {
        secret: jwtSecret,
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    },
    refreshToken: {
        secret: refreshSecret,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
};
