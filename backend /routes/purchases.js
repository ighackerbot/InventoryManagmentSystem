import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

// Get all purchases in a store (admin/coadmin only)
router.get('/', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req, res) => {
    try {
        const { start_date, end_date, product_id, supplier_name } = req.query;

        let query = supabase
            .from('purchases')
            .select(`
                *,
                products (name, sku)
            `)
            .eq('store_id', req.storeId)
            .order('created_at', { ascending: false });

        if (start_date) {
            query = query.gte('created_at', start_date);
        }
        if (end_date) {
            query = query.lte('created_at', end_date);
        }
        if (product_id) {
            query = query.eq('product_id', product_id);
        }
        if (supplier_name) {
            query = query.ilike('supplier_name', `%${supplier_name}%`);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

// Create purchase (admin/coadmin only)
router.post('/',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    injectStoreMetadata,
    async (req, res) => {
        try {
            const { product_id, quantity, cost_price, supplier_name } = req.body;

            if (!product_id || !quantity || !cost_price) {
                return res.status(400).json({
                    error: 'Product ID, quantity, and cost price are required'
                });
            }

            // Verify product exists in this store
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('id, name')
                .eq('id', product_id)
                .eq('store_id', req.storeId)
                .single();

            if (productError) {
                return res.status(404).json({ error: 'Product not found in this store' });
            }

            const total_amount = quantity * cost_price;

            // Create purchase (trigger will auto-update stock)
            const { data: purchase, error: purchaseError } = await supabase
                .from('purchases')
                .insert([{
                    store_id: req.storeId,
                    product_id,
                    quantity,
                    cost_price,
                    total_amount,
                    supplier_name,
                    created_by: req.user.id
                }])
                .select()
                .single();

            if (purchaseError) {
                return res.status(400).json({ error: purchaseError.message });
            }

            res.status(201).json(purchase);
        } catch (error) {
            console.error('Create purchase error:', error);
            res.status(500).json({ error: 'Failed to create purchase' });
        }
    });

// Update purchase (admin/coadmin only)
router.put('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity, cost_price, supplier_name } = req.body;

            const updates = {};
            if (quantity !== undefined) {
                updates.quantity = quantity;
                if (cost_price !== undefined) {
                    updates.total_amount = quantity * cost_price;
                }
            }
            if (cost_price !== undefined) {
                updates.cost_price = cost_price;
                if (quantity === undefined) {
                    // Need to get current quantity
                    const { data: current } = await supabase
                        .from('purchases')
                        .select('quantity')
                        .eq('id', id)
                        .single();
                    if (current) {
                        updates.total_amount = current.quantity * cost_price;
                    }
                }
            }
            if (supplier_name !== undefined) updates.supplier_name = supplier_name;

            const { data, error } = await supabase
                .from('purchases')
                .update(updates)
                .eq('id', id)
                .eq('store_id', req.storeId)
                .select()
                .single();

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.json(data);
        } catch (error) {
            console.error('Update purchase error:', error);
            res.status(500).json({ error: 'Failed to update purchase' });
        }
    });

// Delete purchase (admin/coadmin only)
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Note: Deleting a purchase does NOT reduce stock automatically
            // This maintains data integrity

            const { error } = await supabase
                .from('purchases')
                .delete()
                .eq('id', id)
                .eq('store_id', req.storeId);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.json({
                message: 'Purchase deleted successfully',
                note: 'Stock was not automatically adjusted. Create a sale if stock needs to be reduced.'
            });
        } catch (error) {
            console.error('Delete purchase error:', error);
            res.status(500).json({ error: 'Failed to delete purchase' });
        }
    });

export default router;
