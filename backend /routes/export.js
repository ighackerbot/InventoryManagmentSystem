import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';

const router = express.Router();

// CSV conversion helper
const convertToCSV = (data, headers) => {
    if (!data || data.length === 0) return '';

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const escaped = ('' + value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
};

// Export sales (all roles can export, but staff doesn't see cost data)
router.get('/:storeId/export/sales', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = supabase
            .from('sales')
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

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Format data for CSV
        const formattedData = data.map(sale => ({
            date: new Date(sale.created_at).toISOString().split('T')[0],
            time: new Date(sale.created_at).toTimeString().split(' ')[0],
            product_name: sale.products?.name || 'N/A',
            sku: sale.products?.sku || 'N/A',
            customer_name: sale.customer_name || '',
            quantity: sale.quantity,
            selling_price: sale.selling_price,
            total_amount: sale.total_amount
        }));

        const headers = ['date', 'time', 'product_name', 'sku', 'customer_name', 'quantity', 'selling_price', 'total_amount'];
        const csv = convertToCSV(formattedData, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-export-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export sales error:', error);
        res.status(500).json({ error: 'Failed to export sales' });
    }
});

// Export purchases (admin/coadmin only)
router.get('/:storeId/export/purchases', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

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

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Format data for CSV
        const formattedData = data.map(purchase => ({
            date: new Date(purchase.created_at).toISOString().split('T')[0],
            time: new Date(purchase.created_at).toTimeString().split(' ')[0],
            product_name: purchase.products?.name || 'N/A',
            sku: purchase.products?.sku || 'N/A',
            supplier_name: purchase.supplier_name || '',
            quantity: purchase.quantity,
            cost_price: purchase.cost_price,
            total_amount: purchase.total_amount
        }));

        const headers = ['date', 'time', 'product_name', 'sku', 'supplier_name', 'quantity', 'cost_price', 'total_amount'];
        const csv = convertToCSV(formattedData, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="purchases-export-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export purchases error:', error);
        res.status(500).json({ error: 'Failed to export purchases' });
    }
});

// Export inventory (admin/coadmin see costs, staff doesn't)
router.get('/:storeId/export/inventory', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', req.storeId)
            .order('name');

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        const isStaff = req.currentStore.role === 'staff';

        // Format data for CSV
        const formattedData = data.map(product => {
            const base = {
                name: product.name,
                sku: product.sku || '',
                description: product.description || '',
                stock: product.stock,
                low_stock_threshold: product.low_stock_threshold,
                selling_price: product.selling_price
            };

            if (!isStaff) {
                base.cost_price = product.cost_price;
                base.profit_per_unit = (product.selling_price - product.cost_price).toFixed(2);
                base.potential_profit = ((product.selling_price - product.cost_price) * product.stock).toFixed(2);
            }

            return base;
        });

        const headers = isStaff
            ? ['name', 'sku', 'description', 'stock', 'low_stock_threshold', 'selling_price']
            : ['name', 'sku', 'description', 'stock', 'low_stock_threshold', 'cost_price', 'selling_price', 'profit_per_unit', 'potential_profit'];

        const csv = convertToCSV(formattedData, headers);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export inventory error:', error);
        res.status(500).json({ error: 'Failed to export inventory' });
    }
});

export default router;
