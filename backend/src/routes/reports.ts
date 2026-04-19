import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';

const router = express.Router();

/** GET /api/reports */
router.get('/', authenticate, requireStoreAccess(), async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = new mongoose.Types.ObjectId(req.storeId);

        const [stockAgg, salesAgg, purchasesAgg, recentSales, recentPurchases, topProducts, lowStockProducts] =
            await Promise.all([
                Product.aggregate([{ $match: { storeId } }, { $group: { _id: null, current_stock: { $sum: '$stock' } } }]),
                Sale.aggregate([{ $match: { storeId } }, { $group: { _id: null, total_sales: { $sum: '$totalAmount' } } }]),
                Purchase.aggregate([{ $match: { storeId } }, { $group: { _id: null, total_purchases: { $sum: '$totalAmount' } } }]),
                Sale.find({ storeId: req.storeId }).populate('productId', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5).lean(),
                Purchase.find({ storeId: req.storeId }).populate('productId', 'name').populate('createdBy', 'name').sort({ createdAt: -1 }).limit(5).lean(),
                Sale.aggregate([
                    { $match: { storeId } },
                    { $group: { _id: '$productId', totalQuantity: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalAmount' } } },
                    { $sort: { totalRevenue: -1 } },
                    { $limit: 5 },
                    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                    { $unwind: '$product' },
                    { $project: { name: '$product.name', totalQuantity: 1, totalRevenue: 1 } }
                ]),
                Product.find({ storeId: req.storeId, $expr: { $lte: ['$stock', '$lowStockThreshold'] } })
                    .select('name stock lowStockThreshold').sort({ stock: 1 }).limit(10).lean()
            ]);

        const currentStock: number = (stockAgg[0] as any)?.current_stock || 0;
        const totalSales: number = (salesAgg[0] as any)?.total_sales || 0;
        const totalPurchases: number = (purchasesAgg[0] as any)?.total_purchases || 0;
        const netRevenue = totalSales - totalPurchases;

        res.json({ totalSales, totalPurchases, currentStock, netRevenue, recentSales, recentPurchases, topProducts, lowStockProducts });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

/** GET /api/reports/stats */
router.get('/stats', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const storeId = new mongoose.Types.ObjectId(req.storeId);

        const stats = await Product.aggregate([
            { $match: { storeId } },
            { $lookup: { from: 'sales', localField: '_id', foreignField: 'productId', as: 'sales' } },
            { $lookup: { from: 'purchases', localField: '_id', foreignField: 'productId', as: 'purchases' } },
            { $addFields: { total_sold: { $sum: '$sales.quantity' }, revenue: { $sum: '$sales.totalAmount' }, total_purchased: { $sum: '$purchases.quantity' }, cost: { $sum: '$purchases.totalAmount' } } },
            { $addFields: { profit_loss: { $subtract: ['$revenue', '$cost'] } } },
            { $project: { _id: 1, name: 1, stock: 1, total_sold: 1, total_purchased: 1, revenue: 1, cost: 1, profit_loss: 1 } }
        ]);

        res.json(stats);
    } catch (error) {
        console.error('Get report stats error:', error);
        res.status(500).json({ error: 'Failed to fetch detailed stats' });
    }
});

export default router;
