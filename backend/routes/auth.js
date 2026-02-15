import express from 'express';
import User from '../models/User.js';
import Store from '../models/Store.js';
import UserStoreRole from '../models/UserStoreRole.js';
import { createAuthResponse } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register a new user (creates user + first store + assigns admin role)
 */
router.post('/signup', async (req, res) => {
    try {
        console.log('🔵 Signup request received:', {
            body: req.body,
            hasName: !!req.body.name,
            hasEmail: !!req.body.email,
            hasPassword: !!req.body.password
        });

        const { name, email, password, storeName, storeType, role, adminCode, adminPin, teamCapacity } = req.body;

        // Validation
        if (!name || !email || !password) {
            console.log('❌ Validation failed: missing required fields');
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            console.log('❌ Validation failed: password too short');
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        console.log('✅ Validation passed, checking for existing user...');

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        console.log('✅ Email available, creating user...');

        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            passwordHash: password, // Will be hashed by pre-save hook
            roleType: 'admin' // First user becomes admin
        });

        await user.save();
        console.log('✅ User created:', user._id);

        // Create first store for the user
        const store = new Store({
            name: storeName || `${name}'s Store`,
            type: storeType || 'Retail Shop',
            ownerId: user._id,
            currency: 'INR',
            taxPercent: 0,
            adminPin: adminCode || adminPin || '',
            teamCapacity: parseInt(teamCapacity) || 50
        });

        await store.save();
        console.log('✅ Store created:', store._id);

        // Assign user as admin of the store
        const userStoreRole = new UserStoreRole({
            userId: user._id,
            storeId: store._id,
            role: 'admin'
        });

        await userStoreRole.save();
        console.log('✅ UserStoreRole created');

        // Generate token and return
        const authResponse = createAuthResponse(user);
        console.log('✅ Token generated, sending response');

        res.status(201).json({
            ...authResponse,
            message: 'User created successfully',
            store: {
                id: store._id,
                name: store.name,
                type: store.type,
                role: 'admin'
            }
        });

        console.log('🎉 Signup successful for:', email);

    } catch (error) {
        console.error('💥 Signup error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password (returns token + user's stores)
 */
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔵 Signin attempt for:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user (include password for comparison)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log('✅ Password verified for:', email);

        // Get user's stores
        let userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency')
            .lean();

        let stores = userStores
            .filter(us => us.storeId) // Filter out any null references
            .map(us => ({
                id: us.storeId._id,
                name: us.storeId.name,
                type: us.storeId.type,
                role: us.role,
                currency: us.storeId.currency
            }));

        // If user has no stores (orphaned from failed signup), create a default one
        if (stores.length === 0) {
            console.log('⚠️ User has no stores, creating default store for:', email);

            const defaultStore = new Store({
                name: `${user.name}'s Store`,
                type: 'Retail Shop',
                ownerId: user._id,
                currency: 'INR',
                taxPercent: 0
            });
            await defaultStore.save();

            const defaultRole = new UserStoreRole({
                userId: user._id,
                storeId: defaultStore._id,
                role: 'admin'
            });
            await defaultRole.save();

            stores = [{
                id: defaultStore._id,
                name: defaultStore.name,
                type: defaultStore.type,
                role: 'admin',
                currency: 'INR'
            }];
            console.log('✅ Default store created for:', email);
        }

        // Generate token
        const authResponse = createAuthResponse(user);

        console.log('✅ Signin successful for:', email, 'with', stores.length, 'stores');

        res.json({
            ...authResponse,
            stores,
            message: 'Signed in successfully'
        });

    } catch (error) {
        console.error('💥 Signin error:', error.message);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

/**
 * POST /api/auth/join-store
 * Co-Admin/Staff signup — join an existing store via admin PIN
 */
router.post('/join-store', async (req, res) => {
    try {
        const { name, email, password, role, adminCode } = req.body;
        console.log('🔵 Join-store request:', { name, email, role, adminCode: adminCode ? '***' : 'missing' });

        // Validation
        if (!name || !email || !password || !adminCode) {
            return res.status(400).json({ error: 'Name, email, password, and admin code are required' });
        }

        if (!['coadmin', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Role must be coadmin or staff' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Find store by admin PIN
        const store = await Store.findOne({ adminPin: adminCode });
        if (!store) {
            console.log('❌ No store found with PIN:', adminCode);
            return res.status(404).json({ error: 'Invalid admin code. No store found with this PIN.' });
        }
        console.log('✅ Found store:', store.name, '(', store._id, ')');

        // Check team capacity
        const currentMembers = await UserStoreRole.countDocuments({ storeId: store._id });
        if (store.teamCapacity && currentMembers >= store.teamCapacity) {
            return res.status(400).json({ error: 'Store has reached its team capacity limit.' });
        }

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            // User exists — check if they're already in this store
            const existingRole = await UserStoreRole.findOne({ userId: user._id, storeId: store._id });
            if (existingRole) {
                return res.status(400).json({ error: 'You are already a member of this store.' });
            }
            console.log('✅ Existing user found, adding to store');
        } else {
            // Create new user
            user = new User({
                name,
                email: email.toLowerCase(),
                passwordHash: password,
                roleType: role
            });
            await user.save();
            console.log('✅ New user created:', user._id);
        }

        // Assign user to the store with the correct role
        const userStoreRole = new UserStoreRole({
            userId: user._id,
            storeId: store._id,
            role: role
        });
        await userStoreRole.save();
        console.log('✅ UserStoreRole created:', role, 'in store', store.name);

        // Generate token
        const authResponse = createAuthResponse(user);

        // Return all stores for this user
        const allUserStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency')
            .lean();

        const stores = allUserStores
            .filter(us => us.storeId)
            .map(us => ({
                id: us.storeId._id,
                name: us.storeId.name,
                type: us.storeId.type,
                role: us.role,
                currency: us.storeId.currency
            }));

        console.log('🎉 Join-store successful for:', email, 'as', role, 'in', store.name);

        res.status(201).json({
            ...authResponse,
            message: `Joined store as ${role} successfully`,
            stores,
            store: {
                id: store._id,
                name: store.name,
                type: store.type,
                role: role
            }
        });

    } catch (error) {
        console.error('💥 Join-store error:', error.message);
        res.status(500).json({ error: 'Failed to join store', details: error.message });
    }
});

/**
 * POST /api/auth/staff-login
 * Staff login flow (separate from regular login)
 * Staff can only login if they have been added to at least one store
 */
router.post('/staff-login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user has any store access (staff must be added to a store)
        const userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type')
            .lean();

        if (!userStores || userStores.length === 0) {
            return res.status(403).json({
                error: 'No store access. Contact your admin to get added to a store.'
            });
        }

        const stores = userStores.map(us => ({
            id: us.storeId._id,
            name: us.storeId.name,
            type: us.storeId.type,
            role: us.role
        }));

        // Generate token
        const authResponse = createAuthResponse(user);

        res.json({
            ...authResponse,
            stores,
            message: 'Staff login successful'
        });

    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({ error: 'Failed to sign in' });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile and their stores
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        // req.user and req.userStores are populated by authenticate middleware
        const stores = req.userStores.map(us => ({
            id: us.store_id,
            name: us.stores.name,
            type: us.stores.type,
            role: us.role,
            currency: us.stores.currency,
            ownerId: us.stores.ownerId
        }));

        res.json({
            user: req.user,
            stores
        });

    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Failed to fetch user data' });
    }
});

/**
 * POST /api/auth/signout
 * Sign out (client-side token removal, no server action needed for JWT)
 */
router.post('/signout', (req, res) => {
    // With JWT, signout is handled client-side by removing the token
    // No server-side action needed unlike session-based auth
    res.json({ message: 'Signed out successfully' });
});

export default router;
