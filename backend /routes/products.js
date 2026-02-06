import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

// Helper function to filter sensitive fields for staff users
const filterProductForRole = (product, role) => {
    if (role === 'staff') {
        // Remove cost_price for staff users
        const { cost_price, ...filtered } = product;
        return filtered;
    }
    return product;
};

// Get all products in a store
router.get('/', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { search, sortBy = 'name', order = 'asc' } = req.query;

        let query = supabase
            .from('products')
            .select('*')
            .eq('store_id', req.storeId);

        if (search) {
            query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
        }

        query = query.order(sortBy, { ascending: order === 'asc' });

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Filter sensitive data based on user role
        const filtered = data.map(p => filterProductForRole(p, req.currentStore.role));

        res.json(filtered);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('store_id', req.storeId)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Filter sensitive data based on user role
        const filtered = filterProductForRole(data, req.currentStore.role);

        res.json(filtered);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (admin/coadmin only)
router.post('/',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    injectStoreMetadata,
    async (req, res) => {
        try {
            const {
                name,
                sku,
                description,
                stock,
                cost_price,
                selling_price,
                low_stock_threshold
            } = req.body;

            if (!name || cost_price === undefined || selling_price === undefined) {
                return res.status(400).json({
                    error: 'Name, cost_price, and selling_price are required'
                });
            }

            const productData = {
                store_id: req.storeId,
                name,
                sku,
                description,
                stock: stock || 0,
                cost_price,
                selling_price,
                low_stock_threshold: low_stock_threshold || 10
            };

            const { data, error } = await supabase
                .from('products')
                .insert([productData])
                .select()
                .single();

            if (error) {
                // Handle unique constraint violation for SKU
                if (error.code === '23505') {
                    return res.status(400).json({ error: 'SKU already exists in this store' });
                }
                return res.status(400).json({ error: error.message });
            }

            res.status(201).json(data);
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    });

// Update product (admin/coadmin only)
router.put('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                sku,
                description,
                stock,
                cost_price,
                selling_price,
                low_stock_threshold
            } = req.body;

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (sku !== undefined) updates.sku = sku;
            if (description !== undefined) updates.description = description;
            if (stock !== undefined) updates.stock = stock;
            if (cost_price !== undefined) updates.cost_price = cost_price;
            if (selling_price !== undefined) updates.selling_price = selling_price;
            if (low_stock_threshold !== undefined) updates.low_stock_threshold = low_stock_threshold;

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .eq('store_id', req.storeId)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return res.status(400).json({ error: 'SKU already exists in this store' });
                }
                return res.status(400).json({ error: error.message });
            }

            res.json(data);
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    });

// Delete product (admin/coadmin only)
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('store_id', req.storeId);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    });

export default router;
