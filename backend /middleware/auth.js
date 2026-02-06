import { supabase } from '../config/supabase.js';

/**
 * Authenticate user and load their accessible stores with roles
 */
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get user's accessible stores with roles
        const { data: userStores, error: storesError } = await supabase
            .from('user_store_roles')
            .select(`
                store_id,
                role,
                stores:store_id (
                    id,
                    name,
                    type,
                    owner_id
                )
            `)
            .eq('user_id', user.id);

        if (storesError) {
            console.error('Error fetching user stores:', storesError);
            return res.status(500).json({ error: 'Failed to load user stores' });
        }

        req.user = user;
        req.userStores = userStores || [];
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

/**
 * Require user to have access to a specific store
 * Store ID should be in req.body.store_id, req.params.storeId, or req.query.store_id
 */
export const requireStoreAccess = (requiredRoles = null) => {
    return (req, res, next) => {
        const storeId = req.body.store_id || req.params.storeId || req.query.store_id;

        if (!storeId) {
            return res.status(400).json({ error: 'Store ID is required' });
        }

        if (!req.userStores || req.userStores.length === 0) {
            return res.status(403).json({ error: 'No store access' });
        }

        const userStore = req.userStores.find(us => us.store_id === storeId);

        if (!userStore) {
            return res.status(403).json({ error: 'Access denied to this store' });
        }

        // Check if role is required
        if (requiredRoles && !requiredRoles.includes(userStore.role)) {
            return res.status(403).json({ 
                error: `Insufficient permissions. Required: ${requiredRoles.join(' or ')}`,
                currentRole: userStore.role
            });
        }

        // Attach current store and role to request
        req.currentStore = userStore;
        req.storeId = storeId;
        next();
    };
};

/**
 * Middleware to inject store_id and created_by into request body
 */
export const injectStoreMetadata = (req, res, next) => {
    if (req.storeId) {
        req.body.store_id = req.storeId;
    }
    if (req.user) {
        req.body.created_by = req.user.id;
    }
    next();
};

/**
 * Check if user has specific role in any of their stores
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
 * Middleware specifically for admin/coadmin only endpoints
 */
export const requireAdmin = requireStoreAccess(['admin', 'coadmin']);

/**
 * Middleware specifically for admin only endpoints (not coadmin)
 */
export const requireOwnerOrAdmin = (req, res, next) => {
    const storeId = req.params.storeId || req.body.store_id;
    
    if (!storeId) {
        return res.status(400).json({ error: 'Store ID is required' });
    }

    const userStore = req.userStores.find(us => us.store_id === storeId);

    if (!userStore) {
        return res.status(403).json({ error: 'Access denied to this store' });
    }

    // Check if user is owner or admin
    const isOwner = userStore.stores?.owner_id === req.user.id;
    const isAdmin = userStore.role === 'admin';

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only store owner or admin can perform this action' });
    }

    req.currentStore = userStore;
    req.storeId = storeId;
    next();
};

