import express, { Request, Response } from 'express';
import Sale from '../models/Sale';
import Product from '../models/Product';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth';
import type { UserRole } from '../types/index';

const router = express.Router();

const filterSaleForRole = (sale: Record<string, unknown>, role: UserRole): Record<string, unknown> => {
    if (role === 'staff' && sale.product && typeof sale.product === 'object') {
        const { costPrice, ...productFiltered } = sale.product as Record<string, unknown>;
        void costPrice;
        return { ...sale, product: productFiltered };
    }
    return sale;
};

/** GET /api/sales */
router.get('/', authenticate, requireStoreAccess(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = '50', skip = '0', sortBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;

        const sales = await Sale.find({ storeId: req.storeId })
            .populate('productId', 'name sku costPrice sellingPrice')
            .populate('createdBy', 'name email')
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .lean();

        const filtered = sales.map(s => filterSaleForRole(s as Record<string, unknown>, req.currentStore!.role));
        const total = await Sale.countDocuments({ storeId: req.storeId });

        res.json({ sales: filtered, total, limit: parseInt(limit), skip: parseInt(skip) });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

/** GET /api/sales/:id */
router.get('/:id', authenticate, requireStoreAccess(), async (req: Request, res: Response): Promise<void> => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, storeId: req.storeId })
            .populate('productId', 'name sku costPrice sellingPrice')
            .populate('createdBy', 'name email');

        if (!sale) { res.status(404).json({ error: 'Sale not found' }); return; }
        const filtered = filterSaleForRole(sale.toObject() as unknown as Record<string, unknown>, req.currentStore!.role);
        res.json(filtered);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Failed to fetch sale' });
    }
});

/** POST /api/sales */
router.post('/', authenticate, requireStoreAccess(), injectStoreMetadata, async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, quantity, sellingPrice, customerName } = req.body as {
            productId?: string; quantity?: number; sellingPrice?: number; customerName?: string;
        };

        if (!productId || !quantity || sellingPrice === undefined) {
            res.status(400).json({ error: 'Product ID, quantity, and selling price are required' }); return;
        }
        if (quantity <= 0) { res.status(400).json({ error: 'Quantity must be greater than 0' }); return; }

        const product = await Product.findOne({ _id: productId, storeId: req.storeId });
        if (!product) { res.status(404).json({ error: 'Product not found in this store' }); return; }
        if (product.stock < quantity) {
            res.status(400).json({ error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}` }); return;
        }

        const sale = await Sale.create({
            storeId: req.storeId, productId, quantity, sellingPrice,
            totalAmount: quantity * sellingPrice, customerName, createdBy: req.user!.id
        });

        await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } }, { runValidators: true });

        const populatedSale = await Sale.findById(sale._id)
            .populate('productId', 'name sku')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedSale);
    } catch (error) {
        console.error('Create sale error:', error);
        res.status(500).json({ error: 'Failed to create sale' });
    }
});

/** DELETE /api/sales/:id */
router.delete('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const sale = await Sale.findOne({ _id: req.params.id, storeId: req.storeId });
        if (!sale) { res.status(404).json({ error: 'Sale not found' }); return; }

        await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: sale.quantity } });
        await Sale.findByIdAndDelete(sale._id);

        res.json({ message: 'Sale deleted and stock restored successfully' });
    } catch (error) {
        console.error('Delete sale error:', error);
        res.status(500).json({ error: 'Failed to delete sale' });
    }
});

export default router;
