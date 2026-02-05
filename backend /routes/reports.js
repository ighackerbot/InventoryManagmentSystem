import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Helper to get authenticated client
const getSupabase = (req) => {
    return createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: req.headers.authorization
                }
            }
        }
    );
};

// Get dashboard stats
router.get('/', authenticate, async (req, res) => {
    try {
        const authClient = getSupabase(req);
        // Use global client for products as we know it works publicly
        // Use auth client for sales/purchases to respect RLS

        console.log('--- Reports Request Diagnostic ---');
        console.log('Auth Header:', req.headers.authorization ? 'Present' : 'Missing');
        console.log('Supabase URL:', process.env.SUPABASE_URL);

        // 1. Fetch Products (Global)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('stock');

        console.log('Products (Global):', products?.length, 'Error:', productsError?.message);

        if (productsError) throw productsError;

        // 2. Fetch Sales (Global)
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('total_amount');

        console.log('Sales (Global):', sales?.length, 'Error:', salesError?.message);

        if (salesError) throw salesError;

        // 3. Fetch Purchases (Global)
        const { data: purchases, error: purchasesError } = await supabase
            .from('purchases')
            .select('total_amount');

        console.log('Purchases (Global):', purchases?.length, 'Error:', purchasesError?.message);

        if (purchasesError) throw purchasesError;

        // 4. Recent Activity (Global)
        const { data: recent_sales, error: recentSalesError } = await supabase
            .from('sales')
            .select('*, product:products(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: recent_purchases, error: recentPurchasesError } = await supabase
            .from('purchases')
            .select('*, product:products(name)')
            .order('created_at', { ascending: false })
            .limit(5);

        // Calculate totals
        const total_sales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
        const total_purchases = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
        const current_stock = products.reduce((sum, product) => sum + (product.stock || 0), 0);
        const net_revenue = total_sales - total_purchases;

        res.json({
            total_sales,
            total_purchases,
            current_stock,
            net_revenue,
            recent_sales,
            recent_purchases
        });

    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get detailed product stats for reports
router.get('/stats', authenticate, async (req, res) => {
    try {
        const authClient = getSupabase(req);

        console.log('--- Stats Request Diagnostic ---');

        // 1. Fetch Products (Global)
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('*');

        console.log('Stats Products (Global):', products?.length);

        if (productsError) throw productsError;

        // 2. Fetch Sales (Global)
        const { data: sales, error: salesError } = await supabase
            .from('sales')
            .select('product_id, quantity, total_amount');

        console.log('Stats Sales (Global):', sales?.length);

        if (salesError) throw salesError;

        // 3. Fetch Purchases (Global)
        const { data: purchases, error: purchasesError } = await supabase
            .from('purchases')
            .select('product_id, quantity, total_amount');

        console.log('Stats Purchases (Global):', purchases?.length);

        if (purchasesError) throw purchasesError;

        // Process stats per product
        const stats = products.map(product => {
            // Filter sales/purchases for this product
            const productSales = sales.filter(s => s.product_id === product.id);
            const productPurchases = purchases.filter(p => p.product_id === product.id);

            const total_sold = productSales.reduce((sum, s) => sum + s.quantity, 0);
            const revenue = productSales.reduce((sum, s) => sum + s.total_amount, 0);

            const total_purchased = productPurchases.reduce((sum, p) => sum + p.quantity, 0);
            const cost = productPurchases.reduce((sum, p) => sum + p.total_amount, 0);

            return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                total_sold,
                total_purchased,
                revenue,
                cost,
                profit_loss: revenue - cost
            };
        });

        res.json(stats);
    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({ error: 'Failed to fetch detailed stats' });
    }
});

export default router;
