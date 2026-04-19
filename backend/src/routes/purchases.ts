import express, { Request, Response } from 'express';
import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

/** GET /api/purchases */
router.get('/', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit = '50', skip = '0', sortBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;

        const purchases = await Purchase.find({ storeId: req.storeId })
            .populate('productId', 'name sku costPrice')
            .populate('createdBy', 'name email')
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .lean();

        const total = await Purchase.countDocuments({ storeId: req.storeId });
        res.json({ purchases, total, limit: parseInt(limit), skip: parseInt(skip) });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

/** GET /api/purchases/:id */
router.get('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, storeId: req.storeId })
            .populate('productId', 'name sku costPrice')
            .populate('createdBy', 'name email');

        if (!purchase) { res.status(404).json({ error: 'Purchase not found' }); return; }
        res.json(purchase);
    } catch (error) {
        console.error('Get purchase error:', error);
        res.status(500).json({ error: 'Failed to fetch purchase' });
    }
});

/** POST /api/purchases */
router.post('/', authenticate, requireStoreAccess(['admin', 'coadmin']), injectStoreMetadata, async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, quantity, costPrice, supplierName } = req.body as {
            productId?: string; quantity?: number; costPrice?: number; supplierName?: string;
        };

        if (!productId || !quantity || costPrice === undefined) {
            res.status(400).json({ error: 'Product ID, quantity, and cost price are required' }); return;
        }
        if (quantity <= 0) { res.status(400).json({ error: 'Quantity must be greater than 0' }); return; }

        const product = await Product.findOne({ _id: productId, storeId: req.storeId });
        if (!product) { res.status(404).json({ error: 'Product not found in this store' }); return; }

        const purchase = await Purchase.create({
            storeId: req.storeId, productId, quantity, costPrice,
            totalAmount: quantity * costPrice, supplierName, createdBy: req.user!.id
        });

        await Product.findByIdAndUpdate(
            productId,
            { $inc: { stock: quantity }, costPrice },
            { runValidators: true }
        );

        const populatedPurchase = await Purchase.findById(purchase._id)
            .populate('productId', 'name sku')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedPurchase);
    } catch (error) {
        console.error('Create purchase error:', error);
        res.status(500).json({ error: 'Failed to create purchase' });
    }
});

/** DELETE /api/purchases/:id */
router.delete('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, storeId: req.storeId });
        if (!purchase) { res.status(404).json({ error: 'Purchase not found' }); return; }

        const product = await Product.findById(purchase.productId);
        if (!product) { res.status(404).json({ error: 'Product not found' }); return; }

        if (product.stock < purchase.quantity) {
            res.status(400).json({ error: `Cannot delete purchase. Stock would become negative. Current stock: ${product.stock}` }); return;
        }

        await Product.findByIdAndUpdate(purchase.productId, { $inc: { stock: -purchase.quantity } });
        await Purchase.findByIdAndDelete(purchase._id);

        res.json({ message: 'Purchase deleted and stock adjusted successfully' });
    } catch (error) {
        console.error('Delete purchase error:', error);
        res.status(500).json({ error: 'Failed to delete purchase' });
    }
});

export default router;
