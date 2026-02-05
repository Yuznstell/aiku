const { authService } = require('../services');
const { success, created, error } = require('../utils/response');
const { setAuthCookies, clearAuthCookies, getRefreshToken } = require('../config/cookies');

class AuthController {
    /**
     * POST /api/auth/register
     * Sets httpOnly cookies for tokens
     */
    async register(req, res) {
        try {
            const { email, password, name } = req.body;
            const result = await authService.register({ email, password, name });

            // Set httpOnly cookies
            setAuthCookies(res, result.accessToken, result.refreshToken);

            // Return user data only (tokens are in cookies)
            return created(res, {
                user: result.user,
                // Include tokens for mobile/API clients that can't use cookies
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            }, 'Registration successful');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/auth/login
     * Sets httpOnly cookies for tokens
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login({ email, password });

            // Set httpOnly cookies
            setAuthCookies(res, result.accessToken, result.refreshToken);

            // Return user data only (tokens are in cookies)
            return success(res, {
                user: result.user,
                // Include tokens for mobile/API clients that can't use cookies
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            }, 'Login successful');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/auth/refresh
     * Gets refresh token from cookie or body, returns new access token
     */
    async refresh(req, res) {
        try {
            // Get refresh token from cookie or body
            const refreshToken = getRefreshToken(req);

            if (!refreshToken) {
                return error(res, 'Refresh token is required', 400);
            }

            const result = await authService.refreshToken(refreshToken);

            // Set new access token cookie
            setAuthCookies(res, result.accessToken, refreshToken);

            return success(res, {
                user: result.user,
                accessToken: result.accessToken,
            }, 'Token refreshed');
        } catch (err) {
            // Clear cookies on refresh failure
            clearAuthCookies(res);
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * POST /api/auth/logout
     * Clears httpOnly cookies
     */
    async logout(req, res) {
        try {
            const refreshToken = getRefreshToken(req);
            await authService.logout(req.user.id, refreshToken);

            // Clear httpOnly cookies
            clearAuthCookies(res);

            return success(res, null, 'Logged out successfully');
        } catch (err) {
            // Still clear cookies even on error
            clearAuthCookies(res);
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * GET /api/auth/profile
     */
    async getProfile(req, res) {
        try {
            const user = await authService.getProfile(req.user.id);
            return success(res, user);
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/auth/profile
     */
    async updateProfile(req, res) {
        try {
            const user = await authService.updateProfile(req.user.id, req.body);
            return success(res, user, 'Profile updated');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }

    /**
     * PUT /api/auth/password
     * Clears all sessions after password change
     */
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            await authService.changePassword(req.user.id, { currentPassword, newPassword });

            // Clear cookies - user needs to re-login
            clearAuthCookies(res);

            return success(res, null, 'Password changed successfully. Please login again.');
        } catch (err) {
            return error(res, err.message, err.status || 500);
        }
    }
}

module.exports = new AuthController();
