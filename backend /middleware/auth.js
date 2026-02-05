import { supabase } from '../config/supabase.js';

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

        // Get user profile with role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return res.status(401).json({ error: 'Profile not found' });
        }

        req.user = user;
        req.profile = profile;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.profile) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!roles.includes(req.profile.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

export const requireAdmin = requireRole(['admin', 'coadmin']);
