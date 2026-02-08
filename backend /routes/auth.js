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
        const { name, email, password, storeName, storeType } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create user
        const user = new User({
            name,
            email: email.toLowerCase(),
            passwordHash: password, // Will be hashed by pre-save hook
            roleType: 'admin' // First user becomes admin
        });

        await user.save();

        // Create first store for the user
        const store = new Store({
            name: storeName || `${name}'s Store`,
            type: storeType || 'shop',
            ownerId: user._id,
            currency: 'INR',
            taxPercent: 0
        });

        await store.save();

        // Assign user as admin of the store
        const userStoreRole = new UserStoreRole({
            userId: user._id,
            storeId: store._id,
            role: 'admin'
        });

        await userStoreRole.save();

        // Generate token and return
        const authResponse = createAuthResponse(user);

        res.status(201).json({
            ...authResponse,
            message: 'User created successfully',
            store: {
                id: store._id,
                name: store.name,
                type: store.type
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * POST /api/auth/signin
 * Sign in with email and password (returns token + user's stores)
 */
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user (include password for comparison)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Get user's stores
        const userStores = await UserStoreRole.find({ userId: user._id })
            .populate('storeId', 'name type ownerId currency')
            .lean();

        const stores = userStores.map(us => ({
            id: us.storeId._id,
            name: us.storeId.name,
            type: us.storeId.type,
            role: us.role,
            currency: us.storeId.currency
        }));

        // Generate token
        const authResponse = createAuthResponse(user);

        res.json({
            ...authResponse,
            stores,
            message: 'Signed in successfully'
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Failed to sign in' });
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
