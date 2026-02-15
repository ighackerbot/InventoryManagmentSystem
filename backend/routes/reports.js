import express from 'express';
import mongoose from 'mongoose';
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
        // CRITICAL: Convert storeId to ObjectId for aggregate $match
        // aggregate() does NOT auto-cast strings like find() does
        const storeId = new mongoose.Types.ObjectId(req.storeId);

        // 1. Calculate total stock
        const stockAgg = await Product.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, current_stock: { $sum: '$stock' } } }
        ]);
        const currentStock = stockAgg[0]?.current_stock || 0;

        // 2. Calculate total sales
        const salesAgg = await Sale.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, total_sales: { $sum: '$totalAmount' } } }
        ]);
        const totalSales = salesAgg[0]?.total_sales || 0;

        // 3. Calculate total purchases
        const purchasesAgg = await Purchase.aggregate([
            { $match: { storeId: storeId } },
            { $group: { _id: null, total_purchases: { $sum: '$totalAmount' } } }
        ]);
        const totalPurchases = purchasesAgg[0]?.total_purchases || 0;

        // 4. Recent Sales
        const recentSales = await Sale.find({ storeId: req.storeId })
            .populate('productId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 5. Recent Purchases
        const recentPurchases = await Purchase.find({ storeId: req.storeId })
            .populate('productId', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 6. Top Products by sales
        const topProducts = await Sale.aggregate([
            { $match: { storeId: storeId } },
            {
                $group: {
                    _id: '$productId',
                    totalQuantity: { $sum: '$quantity' },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // 7. Low Stock Products
        const lowStockProducts = await Product.find({
            storeId: req.storeId,
            $expr: { $lte: ['$stock', '$lowStockThreshold'] }
        })
            .select('name stock lowStockThreshold')
            .sort({ stock: 1 })
            .limit(10)
            .lean();

        const netRevenue = totalSales - totalPurchases;

        // Return camelCase field names to match Dashboard.jsx expectations
        res.json({
            totalSales,
            totalPurchases,
            currentStock,
            netRevenue,
            recentSales,
            recentPurchases,
            topProducts,
            lowStockProducts
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
        const storeId = new mongoose.Types.ObjectId(req.storeId);

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
