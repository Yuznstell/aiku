const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Generate access token
 * @param {string} userId - The user ID
 * @returns {string} Access token
 */
const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        jwtConfig.accessToken.secret,
        { expiresIn: jwtConfig.accessToken.expiresIn }
    );
};

/**
 * Generate refresh token
 * @param {string} userId - The user ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId },
        jwtConfig.refreshToken.secret,
        { expiresIn: jwtConfig.refreshToken.expiresIn }
    );
};

/**
 * Verify refresh token
 * @param {string} token - The refresh token
 * @returns {object} Decoded token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, jwtConfig.refreshToken.secret);
};

/**
 * Get token expiry date
 * @param {string} expiresIn - Express in string (e.g., '7d', '15m')
 * @returns {Date} Expiry date
 */
const getTokenExpiry = (expiresIn) => {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
        throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case 's':
            now.setSeconds(now.getSeconds() + value);
            break;
        case 'm':
            now.setMinutes(now.getMinutes() + value);
            break;
        case 'h':
            now.setHours(now.getHours() + value);
            break;
        case 'd':
            now.setDate(now.getDate() + value);
            break;
    }

    return now;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getTokenExpiry,
};
