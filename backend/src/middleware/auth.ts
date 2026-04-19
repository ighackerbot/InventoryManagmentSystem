import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import UserStoreRole from '../models/UserStoreRole.js';
import type { UserRole } from '../types/index.js';

/**
 * Authenticate user via JWT token and load their accessible stores
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        const user = await User.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        const userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency taxPercent')
            .lean();

        const formattedStores = userStores.map(us => ({
            store_id: String((us.storeId as any)._id),
            role: us.role as UserRole,
            stores: us.storeId as any
        }));

        req.user = {
            id: String(user._id),
            email: user.email,
            name: user.name,
            roleType: user.roleType
        };
        req.userStores = formattedStores;

        next();
    } catch (error) {
        const err = error as Error;
        console.error('Auth error:', err.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Require user to have access to a specific store
 */
export const requireStoreAccess = (requiredRoles: UserRole[] | null = null) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const storeId =
            (req.headers['x-store-id'] as string | undefined) ||
            req.params.storeId ||
            req.body?.store_id ||
            (req.query.store_id as string | undefined);

        if (!storeId) {
            res.status(400).json({ error: 'Store ID is required (x-store-id header, storeId param, or store_id)' });
            return;
        }

        if (!req.userStores || req.userStores.length === 0) {
            res.status(403).json({ error: 'No store access' });
            return;
        }

        const userStore = req.userStores.find(us => String(us.store_id) === String(storeId));
        if (!userStore) {
            res.status(403).json({ error: 'Access denied to this store' });
            return;
        }

        if (requiredRoles && !requiredRoles.includes(userStore.role)) {
            res.status(403).json({
                error: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
                currentRole: userStore.role
            });
            return;
        }

        req.currentStore = userStore;
        req.storeId = storeId;
        next();
    };
};

/**
 * Inject store_id and created_by into request body for create operations
 */
export const injectStoreMetadata = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.storeId) {
        req.body.store_id = req.storeId;
        req.body.storeId = req.storeId;
    }
    if (req.user) {
        req.body.created_by = req.user.id;
        req.body.createdBy = req.user.id;
    }
    next();
};

/**
 * Check if user has specific role in ANY of their stores
 */
export const hasAnyStoreRole = (roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.userStores || req.userStores.length === 0) {
            res.status(403).json({ error: 'No store access' });
            return;
        }

        const hasRole = req.userStores.some(us => roles.includes(us.role));
        if (!hasRole) {
            res.status(403).json({ error: `Insufficient permissions. Required: ${roles.join(' or ')}` });
            return;
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
export const requireOwnerOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const storeId =
        (req.headers['x-store-id'] as string | undefined) ||
        req.params.storeId ||
        req.body?.store_id;

    if (!storeId) {
        res.status(400).json({ error: 'Store ID is required' });
        return;
    }

    const userStore = req.userStores?.find(us => String(us.store_id) === String(storeId));
    if (!userStore) {
        res.status(403).json({ error: 'Access denied to this store' });
        return;
    }

    const isOwner = String(userStore.stores?.ownerId) === String(req.user?.id);
    const isAdmin = userStore.role === 'admin';

    if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Only store owner or admin can perform this action' });
        return;
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
