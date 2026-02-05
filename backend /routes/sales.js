import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all sales (authenticated users)
router.get('/', authenticate, async (req, res) => {
    try {
        const { startDate, endDate, productId, customer } = req.query;
    let query = supabase
  .from('sales')
  .select(`
    id,
    created_at,
    product_name,
    quantity,
    unit_price,
    total_amount,
    customer,
    user:profiles(email)
  `)
  .order('created_at', { ascending: false });


        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        if (productId) {
            query = query.eq('product_id', productId);
        }
        if (customer) {
            query = query.ilike('customer', `%${customer}%`);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

// Create sale (authenticated users)
router.post('/', authenticate, async (req, res) => {
    try {
        const { product_id, quantity, unit_price, customer } = req.body;
        const user_id = req.user.id;

        if (!product_id || !quantity || !unit_price || !customer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const total_amount = quantity * unit_price;

        // Get current product stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', product_id)
            .single();

        if (productError) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if enough stock
        if (product.stock < quantity) {
            return res.status(400).json({
                error: 'Insufficient stock',
                available: product.stock,
                requested: quantity
            });
        }

        // Create sale record
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert([{
                product_id,
                quantity,
                unit_price,
                total_amount,
                customer,
                user_id,
            }])
            .select()
            .single();

        if (saleError) {
            // Check if it's a duplicate sale error
            if (saleError.code === '23505') { // Unique constraint violation
                return res.status(409).json({
                    error: 'Duplicate sale detected',
                    message: 'This sale appears to be a duplicate. The same product, quantity, and customer were recorded within the same minute.'
                });
            }
            return res.status(400).json({ error: saleError.message });
        }

        // Update product stock
        const newStock = product.stock - quantity;
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', product_id);

        if (updateError) {
            // Rollback: delete the sale if stock update fails
            await supabase.from('sales').delete().eq('id', sale.id);
            return res.status(400).json({ error: 'Failed to update stock' });
        }

        res.status(201).json(sale);
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Failed to create sale' });
    }
});

export default router;
