import express from 'express';
import Store from '../models/Store.js';
import UserStoreRole from '../models/UserStoreRole.js';
import { authenticate, requireStoreAccess, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/stores
 * Get all stores accessible to the user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        // req.userStores is populated by authenticate middleware
        const stores = req.userStores.map(us => ({
            ...us.stores,
            _id: us.store_id,
            user_role: us.role
        }));

        res.json(stores);
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

/**
 * POST /api/stores
 * Create a new store
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, type, address, currency, taxPercent, adminPin, teamCapacity } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        // Create store
        const store = new Store({
            name,
            type,
            address,
            currency: currency || 'INR',
            taxPercent: taxPercent || 0,
            ownerId: req.user.id,
            adminPin: adminPin || undefined,
            teamCapacity: teamCapacity || 50
        });

        await store.save();

        // Assign creator as admin
        const userStoreRole = new UserStoreRole({
            userId: req.user.id,
            storeId: store._id,
            role: 'admin'
        });

        await userStoreRole.save();

        res.status(201).json(store);
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
});

/**
 * GET /api/stores/:storeId
 * Get single store details
 */
router.get('/:storeId', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const store = await Store.findById(req.storeId).lean();

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        res.json({
            ...store,
            user_role: req.currentStore.role
        });
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ error: 'Failed to fetch store' });
    }
});

/**
 * PUT /api/stores/:storeId
 * Update store settings (admin only)
 */
router.put('/:storeId', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { name, type, address, currency, taxPercent } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (type !== undefined) updates.type = type;
        if (address !== undefined) updates.address = address;
        if (currency !== undefined) updates.currency = currency;
        if (taxPercent !== undefined) updates.taxPercent = taxPercent;

        const store = await Store.findByIdAndUpdate(
            req.storeId,
            updates,
            { new: true, runValidators: true }
        );

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        res.json(store);
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
});

/**
 * DELETE /api/stores/:storeId
 * Delete store (owner only)
 */
router.delete('/:storeId', authenticate, requireOwnerOrAdmin, async (req, res) => {
    try {
        // requireOwnerOrAdmin already validated ownership
        const store = await Store.findById(req.storeId);

        if (!store) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Check if user is the owner
        if (store.ownerId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ error: 'Only store owner can delete the store' });
        }

        // Delete store (cascade will handle related data via MongoDB)
        await Store.findByIdAndDelete(req.storeId);

        // Also delete all user-store-role mappings
        await UserStoreRole.deleteMany({ storeId: req.storeId });

        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
});

export default router;
