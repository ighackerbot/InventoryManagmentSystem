import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import UserStoreRole from '../models/UserStoreRole.js';

/**
 * Authenticate user via JWT token and load their accessible stores
 * Extracts token from Authorization header, verifies it, and loads user's stores with roles
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        const decoded = verifyToken(token);

        // Get user from database
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Get user's accessible stores with roles
        const userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency taxPercent')
            .lean();

        // Format stores for easier access
        const formattedStores = userStores.map(us => ({
            store_id: us.storeId._id,
            role: us.role,
            stores: us.storeId // Keep the populated store data
        }));

        // Attach to request
        req.user = {
            id: user._id,
            email: user.email,
            name: user.name,
            roleType: user.roleType
        };
        req.userStores = formattedStores;

        next();
    } catch (error) {
        console.error('Auth error:', error.message);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Require user to have access to a specific store
 * Store ID can be in: x-store-id header, req.params.storeId, req.body.store_id, req.query.store_id
 * Validates user has access to the store and optionally checks for specific roles
 * 
 * @param {Array|null} requiredRoles - Array of allowed roles ['admin', 'coadmin'] or null for any role
 */
export const requireStoreAccess = (requiredRoles = null) => {
    return (req, res, next) => {
        // Extract store ID from multiple possible sources
        // Priority: 1. Header x-store-id, 2. URL param, 3. Body, 4. Query
        const storeId = req.headers['x-store-id'] ||
            req.params.storeId ||
            req.body.store_id ||
            req.query.store_id;

        if (!storeId) {
            return res.status(400).json({ error: 'Store ID is required (x-store-id header, storeId param, or store_id)' });
        }

        if (!req.userStores || req.userStores.length === 0) {
            return res.status(403).json({ error: 'No store access' });
        }

        // Find user's access to this specific store
        const userStore = req.userStores.find(us => us.store_id.toString() === storeId.toString());

        if (!userStore) {
            return res.status(403).json({ error: 'Access denied to this store' });
        }

        // Check role requirements if specified
        if (requiredRoles && !requiredRoles.includes(userStore.role)) {
            return res.status(403).json({
                error: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
                currentRole: userStore.role
            });
        }

        // Attach validated store info to request
        req.currentStore = userStore;
        req.storeId = storeId;

        next();
    };
};

/**
 * Middleware to inject store_id and created_by into request body
 * Used for create operations
 */
export const injectStoreMetadata = (req, res, next) => {
    if (req.storeId) {
        req.body.store_id = req.storeId;
        req.body.storeId = req.storeId; // Support both formats
    }
    if (req.user) {
        req.body.created_by = req.user.id;
        req.body.createdBy = req.user.id; // Support both formats
    }
    next();
};

/**
 * Check if user has specific role in ANY of their stores
 * @param {Array} roles - Required roles
 */
export const hasAnyStoreRole = (roles) => {
    return (req, res, next) => {
        if (!req.userStores || req.userStores.length === 0) {
            return res.status(403).json({ error: 'No store access' });
        }

        const hasRole = req.userStores.some(us => roles.includes(us.role));

        if (!hasRole) {
            return res.status(403).json({
                error: `Insufficient permissions. Required: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Require admin or coadmin role for the specified store
 */
export const requireAdmin = requireStoreAccess(['admin', 'coadmin']);

/**
 * Require owner or admin role (for sensitive operations like store deletion)
 */
export const requireOwnerOrAdmin = (req, res, next) => {
    const storeId = req.headers['x-store-id'] ||
        req.params.storeId ||
        req.body.store_id;

    if (!storeId) {
        return res.status(400).json({ error: 'Store ID is required' });
    }

    const userStore = req.userStores.find(us => us.store_id.toString() === storeId.toString());

    if (!userStore) {
        return res.status(403).json({ error: 'Access denied to this store' });
    }

    // Check if user is owner or admin
    const isOwner = userStore.stores?.ownerId?.toString() === req.user.id.toString();
    const isAdmin = userStore.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only store owner or admin can perform this action' });
    }

    req.currentStore = userStore;
    req.storeId = storeId;
    next();
};

export default {
    authenticate,
    requireStoreAccess,
    injectStoreMetadata,
    hasAnyStoreRole,
    requireAdmin,
    requireOwnerOrAdmin
};
