import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all purchases (admin/coadmin only)
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { startDate, endDate, productId, supplier } = req.query;

        let query = supabase
            .from('purchases')
            .select(`
        *,
        product:products(id, name),
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
        if (supplier) {
            query = query.ilike('supplier', `%${supplier}%`);
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
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { product_id, quantity, unit_price, supplier } = req.body;
        const user_id = req.user.id;

        if (!product_id || !quantity || !unit_price || !supplier) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const total_amount = quantity * unit_price;

        // Start a transaction-like operation
        // First, get current product stock
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', product_id)
            .single();

        if (productError) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Create purchase record
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([{
                product_id,
                quantity,
                unit_price,
                total_amount,
                supplier,
                user_id,
            }])
            .select()
            .single();

        if (purchaseError) {
            return res.status(400).json({ error: purchaseError.message });
        }

        // Update product stock
        const newStock = product.stock + quantity;
        const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', product_id);

        if (updateError) {
            // Rollback: delete the purchase if stock update fails
            await supabase.from('purchases').delete().eq('id', purchase.id);
            return res.status(400).json({ error: 'Failed to update stock' });
        }

        res.status(201).json(purchase);
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({ error: 'Failed to create purchase' });
    }
});

export default router;
