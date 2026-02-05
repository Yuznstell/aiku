// Role-Based Access Control Middleware

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required',
        });
    }
    next();
};

// Check resource ownership
const isOwner = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

        if (req.user.role === 'ADMIN') {
            return next();
        }

        if (resourceUserId && resourceUserId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to access this resource',
            });
        }

        next();
    };
};

module.exports = { authorize, isAdmin, isOwner };
