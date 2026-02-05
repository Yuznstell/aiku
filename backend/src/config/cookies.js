/**
 * Cookie Configuration for Secure JWT Storage
 * 
 * This config provides httpOnly cookie settings for JWT tokens
 * to prevent XSS attacks from stealing tokens via JavaScript
 */

const isProduction = process.env.NODE_ENV === 'production';

const cookieConfig = {
    // Access token cookie (short-lived)
    accessToken: {
        name: 'accessToken',
        options: {
            httpOnly: true,          // Prevents JavaScript access (XSS protection)
            secure: isProduction,    // HTTPS only in production
            sameSite: 'strict',      // CSRF protection
            path: '/',
            maxAge: 15 * 60 * 1000,  // 15 minutes in milliseconds
        },
    },

    // Refresh token cookie (long-lived)
    refreshToken: {
        name: 'refreshToken',
        options: {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            path: '/api/auth',       // Only sent to auth endpoints
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        },
    },

    // Clear cookie options (for logout)
    clear: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        expires: new Date(0),
    },

    clearRefresh: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/api/auth',
        expires: new Date(0),
    },
};

/**
 * Set access token cookie
 */
const setAccessTokenCookie = (res, token) => {
    res.cookie(
        cookieConfig.accessToken.name,
        token,
        cookieConfig.accessToken.options
    );
};

/**
 * Set refresh token cookie
 */
const setRefreshTokenCookie = (res, token) => {
    res.cookie(
        cookieConfig.refreshToken.name,
        token,
        cookieConfig.refreshToken.options
    );
};

/**
 * Set both tokens
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);
};

/**
 * Clear auth cookies (logout)
 */
const clearAuthCookies = (res) => {
    res.cookie(cookieConfig.accessToken.name, '', cookieConfig.clear);
    res.cookie(cookieConfig.refreshToken.name, '', cookieConfig.clearRefresh);
};

/**
 * Get access token from cookie or header (backward compatibility)
 */
const getAccessToken = (req) => {
    // Priority 1: Cookie
    if (req.cookies && req.cookies[cookieConfig.accessToken.name]) {
        return req.cookies[cookieConfig.accessToken.name];
    }

    // Priority 2: Authorization header (for mobile/API clients)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
};

/**
 * Get refresh token from cookie or body
 */
const getRefreshToken = (req) => {
    // Priority 1: Cookie
    if (req.cookies && req.cookies[cookieConfig.refreshToken.name]) {
        return req.cookies[cookieConfig.refreshToken.name];
    }

    // Priority 2: Request body (for API clients)
    if (req.body && req.body.refreshToken) {
        return req.body.refreshToken;
    }

    return null;
};

module.exports = {
    cookieConfig,
    setAccessTokenCookie,
    setRefreshTokenCookie,
    setAuthCookies,
    clearAuthCookies,
    getAccessToken,
    getRefreshToken,
};
