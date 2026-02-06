import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess, requireOwnerOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all stores accessible to the user
router.get('/', authenticate, async (req, res) => {
    try {
        const stores = req.userStores.map(us => ({
            ...us.stores,
            user_role: us.role
        }));

        res.json(stores);
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Create a new store
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, type, address, currency, tax_percent } = req.body;

        if (!name || !type) {
            return res.status(400).json({ error: 'Name and type are required' });
        }

        // Create store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert([{
                name,
                type,
                address,
                currency: currency || 'INR',
                tax_percent: tax_percent || 0,
                owner_id: req.user.id
            }])
            .select()
            .single();

        if (storeError) {
            return res.status(400).json({ error: storeError.message });
        }

        // Assign creator as admin
        const { error: roleError } = await supabase
            .from('user_store_roles')
            .insert([{
                user_id: req.user.id,
                store_id: store.id,
                role: 'admin'
            }]);

        if (roleError) {
            console.error('Role assignment error:', roleError);
            // Don't fail the request, store was created successfully
        }

        res.status(201).json(store);
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
});

// Get single store details
router.get('/:storeId', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { data: store, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', req.storeId)
            .single();

        if (error) {
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

// Update store settings (admin only)
router.put('/:storeId', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { name, type, address, currency, tax_percent } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (type !== undefined) updates.type = type;
        if (address !== undefined) updates.address = address;
        if (currency !== undefined) updates.currency = currency;
        if (tax_percent !== undefined) updates.tax_percent = tax_percent;

        const { data: store, error } = await supabase
            .from('stores')
            .update(updates)
            .eq('id', req.storeId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(store);
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
});

// Delete store (owner only)
router.delete('/:storeId', authenticate, requireOwnerOrAdmin, async (req, res) => {
    try {
        // Check if user is the owner
        const { data: store } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', req.storeId)
            .single();

        if (store.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only store owner can delete the store' });
        }

        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', req.storeId);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ error: 'Failed to delete store' });
    }
});

export default router;
