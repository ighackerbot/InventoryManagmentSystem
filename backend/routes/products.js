import express from 'express';
import Product from '../models/Product.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper function to filter sensitive fields for staff users
 */
const filterProductForRole = (product, role) => {
    if (role === 'staff') {
        // Remove cost_price for staff users
        const productObj = product.toObject ? product.toObject() : product;
        const { costPrice, ...filtered } = productObj;
        return filtered;
    }
    return product.toObject ? product.toObject() : product;
};

/**
 * GET /api/products
 * Get all products in a store
 * Requires: x-store-id header
 */
router.get('/', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { search, sortBy = 'name', order = 'asc' } = req.query;

        // Build query - MUST filter by storeId
        let query = Product.find({ storeId: req.storeId });

        // Search by name or SKU
        if (search) {
            query = query.or([
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ]);
        }

        // Sort
        const sortOrder = order === 'asc' ? 1 : -1;
        query = query.sort({ [sortBy]: sortOrder });

        const products = await query.lean();

        // Filter sensitive data based on user role
        const filtered = products.map(p => filterProductForRole(p, req.currentStore.role));

        res.json(filtered);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * GET /api/products/:id
 * Get single product
 * Requires: x-store-id header
 */
router.get('/:id', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { id } = req.params;

        // MUST filter by both id AND storeId
        const product = await Product.findOne({
            _id: id,
            storeId: req.storeId
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Filter sensitive data based on user role
        const filtered = filterProductForRole(product, req.currentStore.role);

        res.json(filtered);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * POST /api/products
 * Create product (admin/coadmin only)
 * Requires: x-store-id header
 */
router.post('/',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    injectStoreMetadata,
    async (req, res) => {
        try {
            const {
                name,
                sku,
                description,
                stock,
                costPrice,
                sellingPrice,
                lowStockThreshold
            } = req.body;

            if (!name || costPrice === undefined || sellingPrice === undefined) {
                return res.status(400).json({
                    error: 'Name, costPrice, and sellingPrice are required'
                });
            }

            const productData = {
                storeId: req.storeId, // CRITICAL: Always set storeId
                name,
                sku,
                description,
                stock: stock || 0,
                costPrice,
                sellingPrice,
                lowStockThreshold: lowStockThreshold || 10
            };

            const product = new Product(productData);
            await product.save();

            res.status(201).json(product);
        } catch (error) {
            console.error('Create product error:', error);

            // Handle unique constraint violation for SKU
            if (error.code === 11000 && error.keyPattern?.sku) {
                return res.status(400).json({ error: 'SKU already exists in this store' });
            }

            res.status(500).json({ error: 'Failed to create product' });
        }
    });

/**
 * PUT /api/products/:id
 * Update product (admin/coadmin only)
 * Requires: x-store-id header
 */
router.put('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                sku,
                description,
                stock,
                costPrice,
                sellingPrice,
                lowStockThreshold
            } = req.body;

            const updates = {};
            if (name !== undefined) updates.name = name;
            if (sku !== undefined) updates.sku = sku;
            if (description !== undefined) updates.description = description;
            if (stock !== undefined) updates.stock = stock;
            if (costPrice !== undefined) updates.costPrice = costPrice;
            if (sellingPrice !== undefined) updates.sellingPrice = sellingPrice;
            if (lowStockThreshold !== undefined) updates.lowStockThreshold = lowStockThreshold;

            // MUST filter by both id AND storeId
            const product = await Product.findOneAndUpdate(
                { _id: id, storeId: req.storeId },
                updates,
                { new: true, runValidators: true }
            );

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json(product);
        } catch (error) {
            console.error('Update product error:', error);

            // Handle unique constraint violation
            if (error.code === 11000) {
                return res.status(400).json({ error: 'SKU already exists in this store' });
            }

            res.status(500).json({ error: 'Failed to update product' });
        }
    });

/**
 * DELETE /api/products/:id
 * Delete product (admin/coadmin only)
 * Requires: x-store-id header
 */
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            const { id } = req.params;

            // MUST filter by both id AND storeId
            const product = await Product.findOneAndDelete({
                _id: id,
                storeId: req.storeId
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    });

export default router;
