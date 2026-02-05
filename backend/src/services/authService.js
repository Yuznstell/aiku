const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getTokenExpiry } = require('../utils/jwt');
const jwtConfig = require('../config/jwt');

class AuthService {
    /**
     * Register a new user
     */
    async register({ email, password, name }) {
        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw { status: 400, message: 'Email already in use' };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: getTokenExpiry(jwtConfig.refreshToken.expiresIn),
            },
        });

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    /**
     * Login user
     */
    async login({ email, password }) {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw { status: 401, message: 'Invalid email or password' };
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            throw { status: 401, message: 'Invalid email or password' };
        }

        // Update online status
        await prisma.user.update({
            where: { id: user.id },
            data: { isOnline: true, lastSeen: new Date() },
        });

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: getTokenExpiry(jwtConfig.refreshToken.expiresIn),
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatar: user.avatar,
                role: user.role,
            },
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(token) {
        // Verify refresh token
        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (error) {
            throw { status: 401, message: 'Invalid refresh token' };
        }

        // Check if token exists in database
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!storedToken) {
            throw { status: 401, message: 'Refresh token not found' };
        }

        // Check if token is expired
        if (new Date() > storedToken.expiresAt) {
            await prisma.refreshToken.delete({ where: { token } });
            throw { status: 401, message: 'Refresh token expired' };
        }

        // Generate new access token
        const accessToken = generateAccessToken(storedToken.userId);

        return {
            accessToken,
            user: {
                id: storedToken.user.id,
                email: storedToken.user.email,
                name: storedToken.user.name,
                avatar: storedToken.user.avatar,
                role: storedToken.user.role,
            },
        };
    }

    /**
     * Logout user
     */
    async logout(userId, refreshToken) {
        // Delete specific refresh token or all tokens for user
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: { token: refreshToken },
            });
        }

        // Update online status
        await prisma.user.update({
            where: { id: userId },
            data: { isOnline: false, lastSeen: new Date() },
        });

        return true;
    }

    /**
     * Get current user profile
     */
    async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
                isOnline: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        return user;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId, data) {
        const updateData = {};

        if (data.name) updateData.name = data.name;
        if (data.avatar) updateData.avatar = data.avatar;

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                role: true,
            },
        });

        return user;
    }

    /**
     * Change password
     */
    async changePassword(userId, { currentPassword, newPassword }) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        const isValid = await bcrypt.compare(currentPassword, user.password);

        if (!isValid) {
            throw { status: 400, message: 'Current password is incorrect' };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate all refresh tokens
        await prisma.refreshToken.deleteMany({
            where: { userId },
        });

        return true;
    }
}

module.exports = new AuthService();
