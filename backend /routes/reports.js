import express from 'express';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/reports
 * Get dashboard stats for a store
 * Requires: x-store-id header
 */
router.get('/', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        // All queries MUST filter by storeId
        const storeId = req.storeId;

        // 1. Calculate total stock
        const stockAgg = await Product.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, current_stock: { $sum: '$stock' } } }
        ]);
        const current_stock = stockAgg[0]?.current_stock || 0;

        // 2. Calculate total sales
        const salesAgg = await Sale.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, total_sales: { $sum: '$totalAmount' } } }
        ]);
        const total_sales = salesAgg[0]?.total_sales || 0;

        // 3. Calculate total purchases
        const purchasesAgg = await Purchase.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, total_purchases: { $sum: '$totalAmount' } } }
        ]);
        const total_purchases = purchasesAgg[0]?.total_purchases || 0;

        // 4. Recent Sales
        const recent_sales = await Sale.find({ storeId })
            .populate('productId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 5. Recent Purchases
        const recent_purchases = await Purchase.find({ storeId })
            .populate('productId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

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

/**
 * GET /api/reports/stats
 * Get detailed product stats for reports
 * Requires: x-store-id header (admin/coadmin only)
 */
router.get('/stats', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req, res) => {
    try {
        const storeId = req.storeId;

        // Get products with sales and purchase aggregations
        const stats = await Product.aggregate([
            // Match products in this store
            { $match: { storeId: storeId } },

            // Left join with sales
            {
                $lookup: {
                    from: 'sales',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'sales'
                }
            },

            // Left join with purchases
            {
                $lookup: {
                    from: 'purchases',
                    localField: '_id',
                    foreignField: 'productId',
                    as: 'purchases'
                }
            },

            // Calculate aggregated stats
            {
                $addFields: {
                    total_sold: { $sum: '$sales.quantity' },
                    revenue: { $sum: '$sales.totalAmount' },
                    total_purchased: { $sum: '$purchases.quantity' },
                    cost: { $sum: '$purchases.totalAmount' },
                }
            },

            // Calculate profit/loss
            {
                $addFields: {
                    profit_loss: { $subtract: ['$revenue', '$cost'] }
                }
            },

            // Project only needed fields
            {
                $project: {
                    _id: 1,
                    name: 1,
                    stock: 1,
                    total_sold: 1,
                    total_purchased: 1,
                    revenue: 1,
                    cost: 1,
                    profit_loss: 1
                }
            }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({ error: 'Failed to fetch detailed stats' });
    }
});

export default router;
