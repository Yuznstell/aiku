const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');
const { getAccessToken } = require('../config/cookies');

/**
 * Verify JWT access token
 * 
 * Supports both:
 * 1. httpOnly cookies (preferred, XSS-safe)
 * 2. Authorization header (for mobile/API clients)
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie or header
        const token = getAccessToken(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                isOnline: true,
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid access token'
        });
    }
};

/**
 * Optional authentication (for public routes that can have auth)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = getAccessToken(req);

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, jwtConfig.accessToken.secret);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
            },
        });

        if (user) {
            req.user = user;
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = { authenticate, optionalAuth };
