import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';

const router = express.Router();

// Get low stock alerts for a store
router.get('/:storeId/low-stock', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', req.storeId)
            .filter('stock', 'lt', supabase.raw('low_stock_threshold'))
            .order('stock', { ascending: true });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Filter cost data for staff
        const filtered = data.map(product => {
            if (req.currentStore.role === 'staff') {
                const { cost_price, ...rest } = product;
                return rest;
            }
            return product;
        });

        res.json(filtered);
    } catch (error) {
        console.error('Get low stock alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch low stock alerts' });
    }
});

// Get count of low stock items
router.get('/:storeId/low-stock/count', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { count, error } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', req.storeId)
            .filter('stock', 'lt', supabase.raw('low_stock_threshold'));

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ count: count || 0 });
    } catch (error) {
        console.error('Get low stock count error:', error);
        res.status(500).json({ error: 'Failed to fetch low stock count' });
    }
});

export default router;
