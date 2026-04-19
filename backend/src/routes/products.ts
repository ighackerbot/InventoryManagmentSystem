import express, { Request, Response } from 'express';
import Product from '../models/Product.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';
import type { UserRole } from '../types/index.js';

const router = express.Router();

const filterProductForRole = (product: Record<string, unknown>, role: UserRole): Record<string, unknown> => {
    if (role === 'staff') {
        const { costPrice, ...filtered } = product;
        void costPrice;
        return filtered;
    }
    return product;
};

/** GET /api/products */
router.get('/', authenticate, requireStoreAccess(), async (req: Request, res: Response): Promise<void> => {
    try {
        const { search, sortBy = 'name', order = 'asc' } = req.query as { search?: string; sortBy?: string; order?: string };

        let query = Product.find({ storeId: req.storeId });
        if (search) {
            query = query.or([
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ]);
        }
        const sortOrder = order === 'asc' ? 1 : -1;
        query = query.sort({ [sortBy]: sortOrder });

        const products = await query.lean();
        const filtered = products.map(p => filterProductForRole(p as Record<string, unknown>, req.currentStore!.role));
        res.json(filtered);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/** GET /api/products/:id */
router.get('/:id', authenticate, requireStoreAccess(), async (req: Request, res: Response): Promise<void> => {
    try {
        const product = await Product.findOne({ _id: req.params.id, storeId: req.storeId });
        if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
        const filtered = filterProductForRole(product.toObject() as unknown as Record<string, unknown>, req.currentStore!.role);
        res.json(filtered);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/** POST /api/products */
router.post('/', authenticate, requireStoreAccess(['admin', 'coadmin']), injectStoreMetadata, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, sku, description, stock, costPrice, sellingPrice, lowStockThreshold } = req.body as {
            name?: string; sku?: string; description?: string; stock?: number;
            costPrice?: number; sellingPrice?: number; lowStockThreshold?: number;
        };

        if (!name || costPrice === undefined || sellingPrice === undefined) {
            res.status(400).json({ error: 'Name, costPrice, and sellingPrice are required' }); return;
        }

        const product = new Product({
            storeId: req.storeId, name, sku, description,
            stock: stock || 0, costPrice, sellingPrice, lowStockThreshold: lowStockThreshold || 10
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        const err = error as { code?: number; keyPattern?: Record<string, unknown>; message: string };
        console.error('Create product error:', err);
        if (err.code === 11000 && err.keyPattern?.sku) {
            res.status(400).json({ error: 'SKU already exists in this store' }); return;
        }
        res.status(500).json({ error: 'Failed to create product' });
    }
});

/** PUT /api/products/:id */
router.put('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, sku, description, stock, costPrice, sellingPrice, lowStockThreshold } = req.body as {
            name?: string; sku?: string; description?: string; stock?: number;
            costPrice?: number; sellingPrice?: number; lowStockThreshold?: number;
        };

        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (sku !== undefined) updates.sku = sku;
        if (description !== undefined) updates.description = description;
        if (stock !== undefined) updates.stock = stock;
        if (costPrice !== undefined) updates.costPrice = costPrice;
        if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
        if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;

        const product = await Product.findOneAndUpdate(
            { _id: req.params.id, storeId: req.storeId },
            updates,
            { new: true, runValidators: true }
        );
        if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
        res.json(product);
    } catch (error) {
        const err = error as { code?: number; message: string };
        console.error('Update product error:', err);
        if (err.code === 11000) { res.status(400).json({ error: 'SKU already exists in this store' }); return; }
        res.status(500).json({ error: 'Failed to update product' });
    }
});

/** DELETE /api/products/:id */
router.delete('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req: Request, res: Response): Promise<void> => {
    try {
        const product = await Product.findOneAndDelete({ _id: req.params.id, storeId: req.storeId });
        if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;
