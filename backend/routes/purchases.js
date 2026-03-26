import express from 'express';
import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import Product from '../models/Product.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/purchases
 * Get all purchases for a store (admin/coadmin only)
 * Requires: x-store-id header
 */
router.get('/', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req, res) => {
    try {
        const { limit = 50, skip = 0, sortBy = 'createdAt', order = 'desc' } = req.query;

        // MUST filter by storeId
        const query = Purchase.find({ storeId: req.storeId })
            .populate('productId', 'name sku costPrice')
            .populate('createdBy', 'name email')
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

        const purchases = await query.lean();

        // Get total count
        const total = await Purchase.countDocuments({ storeId: req.storeId });

        res.json({
            purchases,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Get purchases error:', error);
        res.status(500).json({ error: 'Failed to fetch purchases' });
    }
});

/**
 * GET /api/purchases/:id
 * Get single purchase (admin/coadmin only)
 * Requires: x-store-id header
 */
router.get('/:id', authenticate, requireStoreAccess(['admin', 'coadmin']), async (req, res) => {
    try {
        const purchase = await Purchase.findOne({
            _id: req.params.id,
            storeId: req.storeId
        })
            .populate('productId', 'name sku costPrice')
            .populate('createdBy', 'name email');

        if (!purchase) {
            return res.status(404).json({ error: 'Purchase not found' });
        }

        res.json(purchase);
    } catch (error) {
        console.error('Get purchase error:', error);
        res.status(500).json({ error: 'Failed to fetch purchase' });
    }
});

/**
 * POST /api/purchases
 * Create a new purchase (with MongoDB transaction for stock update)
 * Admin/coadmin only
 * Requires: x-store-id header
 */
router.post('/',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    injectStoreMetadata,
    async (req, res) => {
        try {
            const {
                productId,
                quantity,
                costPrice,
                supplierName
            } = req.body;

            if (!productId || !quantity || costPrice === undefined) {
                return res.status(400).json({
                    error: 'Product ID, quantity, and cost price are required'
                });
            }

            if (quantity <= 0) {
                return res.status(400).json({ error: 'Quantity must be greater than 0' });
            }

            // 1. Check product exists
            const product = await Product.findOne({
                _id: productId,
                storeId: req.storeId
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found in this store' });
            }

            // 2. Create purchase
            const purchaseData = {
                storeId: req.storeId,
                productId,
                quantity,
                costPrice,
                totalAmount: quantity * costPrice,
                supplierName,
                createdBy: req.user.id
            };

            const purchase = await Purchase.create(purchaseData);

            // 3. Update product stock
            await Product.findByIdAndUpdate(
                productId,
                {
                    $inc: { stock: quantity },
                    costPrice: costPrice // Update cost price with latest purchase
                },
                { runValidators: true }
            );

            // Populate and return
            const populatedPurchase = await Purchase.findById(purchase._id)
                .populate('productId', 'name sku')
                .populate('createdBy', 'name email');

            res.status(201).json(populatedPurchase);

        } catch (error) {
            console.error('Create purchase error:', error);
            res.status(500).json({ error: 'Failed to create purchase' });
        }
    });

/**
 * DELETE /api/purchases/:id
 * Delete purchase and reduce stock (admin/coadmin only)
 * Requires: x-store-id header
 */
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        try {
            // Find purchase
            const purchase = await Purchase.findOne({
                _id: req.params.id,
                storeId: req.storeId
            });

            if (!purchase) {
                return res.status(404).json({ error: 'Purchase not found' });
            }

            // Check if we can reduce stock (must not go negative)
            const product = await Product.findById(purchase.productId);

            if (product.stock < purchase.quantity) {
                return res.status(400).json({
                    error: `Cannot delete purchase. Stock would become negative. Current stock: ${product.stock}`
                });
            }

            // Reduce stock
            await Product.findByIdAndUpdate(
                purchase.productId,
                { $inc: { stock: -purchase.quantity } }
            );

            // Delete purchase
            await Purchase.findByIdAndDelete(purchase._id);

            res.json({ message: 'Purchase deleted and stock adjusted successfully' });

        } catch (error) {
            console.error('Delete purchase error:', error);
            res.status(500).json({ error: 'Failed to delete purchase' });
        }
    });

export default router;
