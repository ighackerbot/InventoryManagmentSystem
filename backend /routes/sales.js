import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

// Helper to filter sale data based on role
const filterSaleForRole = (sale, role) => {
    if (role === 'staff') {
        // Staff cannot see cost-related fields or profit calculations
        const { cost_price, ...filtered } = sale;
        return filtered;
    }
    return sale;
};

// Get all sales in a store
router.get('/', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { start_date, end_date, product_id, customer_name } = req.query;

        let query = supabase
            .from('sales')
            .select(`
                *,
                products (name, sku, cost_price)
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
        if (customer_name) {
            query = query.ilike('customer_name', `%${customer_name}%`);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Add profit calculation and filter based on role
        const enrichedData = data.map(sale => {
            const saleWithProfit = {
                ...sale,
                profit: sale.products?.cost_price
                    ? (sale.selling_price - sale.products.cost_price) * sale.quantity
                    : null
            };
            return filterSaleForRole(saleWithProfit, req.currentStore.role);
        });

        res.json(enrichedData);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// Create sale (all authenticated store members)
router.post('/',
    authenticate,
    requireStoreAccess(),
    injectStoreMetadata,
    async (req, res) => {
        try {
            const { product_id, quantity, selling_price, customer_name } = req.body;

            if (!product_id || !quantity || !selling_price) {
                return res.status(400).json({
                    error: 'Product ID, quantity, and selling price are required'
                });
            }

            // Get product to verify stock and get pricing
            const { data: product, error: productError } = await supabase
                .from('products')
                .select('stock, selling_price, name')
                .eq('id', product_id)
                .eq('store_id', req.storeId)
                .single();

            if (productError) {
                return res.status(404).json({ error: 'Product not found in this store' });
            }

            // Check stock availability (trigger will also check, but this gives better error message)
            if (product.stock < quantity) {
                return res.status(400).json({
                    error: 'Insufficient stock',
                    available: product.stock,
                    requested: quantity
                });
            }

            const total_amount = quantity * selling_price;

            // Create sale (trigger will auto-update stock)
            const { data: sale, error: saleError } = await supabase
                .from('sales')
                .insert([{
                    store_id: req.storeId,
                    product_id,
                    quantity,
                    selling_price,
                    total_amount,
                    customer_name,
                    created_by: req.user.id
                }])
                .select()
                .single();

            if (saleError) {
                return res.status(400).json({ error: saleError.message });
            }

            res.status(201).json(sale);
        } catch (error) {
            console.error('Create sale error:', error);
            res.status(500).json({ error: 'Failed to create sale' });
        }
    });

// Update sale (admin/coadmin only)
router.put('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { quantity, selling_price, customer_name } = req.body;

            const updates = {};
            if (quantity !== undefined) {
                updates.quantity = quantity;
                if (selling_price !== undefined) {
                    updates.total_amount = quantity * selling_price;
                }
            }
            if (selling_price !== undefined) {
                updates.selling_price = selling_price;
                if (quantity === undefined) {
                    // Need to get current quantity
                    const { data: current } = await supabase
                        .from('sales')
                        .select('quantity')
                        .eq('id', id)
                        .single();
                    if (current) {
                        updates.total_amount = current.quantity * selling_price;
                    }
                }
            }
            if (customer_name !== undefined) updates.customer_name = customer_name;

            const { data, error } = await supabase
                .from('sales')
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
            console.error('Update sale error:', error);
            res.status(500).json({ error: 'Failed to update sale' });
        }
    });

// Delete sale (admin/coadmin only)
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // Note: Deleting a sale does NOT restore stock automatically
            // This is intentional to maintain data integrity
            // If you want to restore stock, you would need to create a return/refund endpoint

            const { error } = await supabase
                .from('sales')
                .delete()
                .eq('id', id)
                .eq('store_id', req.storeId);

            if (error) {
                return res.status(400).json({ error: error.message });
            }

            res.json({
                message: 'Sale deleted successfully',
                note: 'Stock was not automatically restored. Create a purchase if stock needs adjustment.'
            });
        } catch (error) {
            console.error('Delete sale error:', error);
            res.status(500).json({ error: 'Failed to delete sale' });
        }
    });

export default router;
