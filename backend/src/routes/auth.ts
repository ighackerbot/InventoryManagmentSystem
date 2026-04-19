import express, { Request, Response } from 'express';
import User from '../models/User.js';
import Store from '../models/Store.js';
import UserStoreRole from '../models/UserStoreRole.js';
import { createAuthResponse } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';
import type { UserRole } from '../types/index.js';

const router = express.Router();

/** POST /api/auth/signup */
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, storeName, storeType, role, adminCode, adminPin, teamCapacity } = req.body as {
            name?: string; email?: string; password?: string; storeName?: string;
            storeType?: string; role?: string; adminCode?: string; adminPin?: string; teamCapacity?: number;
        };

        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ error: 'User already exists with this email' });
            return;
        }

        const user = new User({ name, email: email.toLowerCase(), passwordHash: password, roleType: 'admin' as UserRole });
        await user.save();

        const store = new Store({
            name: storeName || `${name}'s Store`,
            type: storeType || 'Retail Shop',
            ownerId: user._id,
            currency: 'INR',
            taxPercent: 0,
            adminPin: adminCode || adminPin || '',
            teamCapacity: parseInt(String(teamCapacity)) || 50
        });
        await store.save();

        const userStoreRole = new UserStoreRole({ userId: user._id, storeId: store._id, role: 'admin' as UserRole });
        await userStoreRole.save();

        const authResponse = createAuthResponse(user);
        res.status(201).json({
            ...authResponse,
            message: 'User created successfully',
            store: { id: store._id, name: store.name, type: store.type, role: 'admin' }
        });
    } catch (error) {
        console.error('💥 Signup error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to create user', details: (error as Error).message });
    }
});

/** POST /api/auth/signin */
router.post('/signin', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
        if (!user) { res.status(401).json({ error: 'Invalid email or password' }); return; }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) { res.status(401).json({ error: 'Invalid email or password' }); return; }

        let userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency').lean();

        let stores = userStores
            .filter(us => us.storeId)
            .map(us => ({
                id: (us.storeId as any)._id,
                name: (us.storeId as any).name,
                type: (us.storeId as any).type,
                role: us.role,
                currency: (us.storeId as any).currency
            }));

        if (stores.length === 0) {
            const defaultStore = new Store({ name: `${user.name}'s Store`, type: 'Retail Shop', ownerId: user._id, currency: 'INR', taxPercent: 0 });
            await defaultStore.save();
            const defaultRole = new UserStoreRole({ userId: user._id, storeId: defaultStore._id, role: 'admin' as UserRole });
            await defaultRole.save();
            stores = [{ id: defaultStore._id, name: defaultStore.name, type: defaultStore.type, role: 'admin', currency: 'INR' }];
        }

        const authResponse = createAuthResponse(user);
        res.json({ ...authResponse, stores, message: 'Signed in successfully' });
    } catch (error) {
        console.error('💥 Signin error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

/** POST /api/auth/join-store */
router.post('/join-store', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, adminCode } = req.body as {
            name?: string; email?: string; password?: string; role?: UserRole; adminCode?: string;
        };

        if (!name || !email || !password || !adminCode) {
            res.status(400).json({ error: 'Name, email, password, and admin code are required' }); return;
        }
        if (!['coadmin', 'staff'].includes(role ?? '')) {
            res.status(400).json({ error: 'Role must be coadmin or staff' }); return;
        }
        if (password.length < 6) { res.status(400).json({ error: 'Password must be at least 6 characters' }); return; }

        const store = await Store.findOne({ adminPin: adminCode });
        if (!store) { res.status(404).json({ error: 'Invalid admin code. No store found with this PIN.' }); return; }

        const currentMembers = await UserStoreRole.countDocuments({ storeId: store._id });
        if (store.teamCapacity && currentMembers >= store.teamCapacity) {
            res.status(400).json({ error: 'Store has reached its team capacity limit.' }); return;
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            const existingRole = await UserStoreRole.findOne({ userId: user._id, storeId: store._id });
            if (existingRole) { res.status(400).json({ error: 'You are already a member of this store.' }); return; }
        } else {
            user = new User({ name, email: email.toLowerCase(), passwordHash: password, roleType: role });
            await user.save();
        }

        const userStoreRole = new UserStoreRole({ userId: user._id, storeId: store._id, role });
        await userStoreRole.save();

        const authResponse = createAuthResponse(user);
        const allUserStores = await UserStoreRole.find({ userId: user._id }).populate('storeId', 'name type ownerId currency').lean();
        const stores = allUserStores.filter(us => us.storeId).map(us => ({
            id: (us.storeId as any)._id,
            name: (us.storeId as any).name,
            type: (us.storeId as any).type,
            role: us.role,
            currency: (us.storeId as any).currency
        }));

        res.status(201).json({ ...authResponse, message: `Joined store as ${role} successfully`, stores, store: { id: store._id, name: store.name, type: store.type, role } });
    } catch (error) {
        console.error('💥 Join-store error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to join store', details: (error as Error).message });
    }
});

/** POST /api/auth/staff-login */
router.post('/staff-login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (!email || !password) { res.status(400).json({ error: 'Email and password are required' }); return; }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
        if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) { res.status(401).json({ error: 'Invalid credentials' }); return; }

        const userStores = await UserStoreRole.find({ userId: user._id }).populate('storeId', 'name type').lean();
        if (!userStores || userStores.length === 0) {
            res.status(403).json({ error: 'No store access. Contact your admin to get added to a store.' }); return;
        }

        const stores = userStores.map(us => ({
            id: (us.storeId as any)._id,
            name: (us.storeId as any).name,
            type: (us.storeId as any).type,
            role: us.role
        }));

        const authResponse = createAuthResponse(user);
        res.json({ ...authResponse, stores, message: 'Staff login successful' });
    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

/** GET /api/auth/me */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
        const stores = req.userStores!.map(us => ({
            id: us.store_id,
            name: us.stores.name,
            type: us.stores.type,
            role: us.role,
            currency: us.stores.currency,
            ownerId: us.stores.ownerId
        }));
        res.json({ user: req.user, stores });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/** POST /api/auth/signout */
router.post('/signout', (_req: Request, res: Response): void => {
    res.json({ message: 'Signed out successfully' });
});

export default router;
