import express from 'express';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import { authenticate, requireStoreAccess, injectStoreMetadata } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to filter sensitive fields for staff
 */
const filterSaleForRole = (sale, role) => {
    const saleObj = sale.toObject ? sale.toObject() : sale;
    if (role === 'staff' && saleObj.product) {
        // Remove cost_price from populated product
        const { costPrice, ...productFiltered } = saleObj.product;
        return { ...saleObj, product: productFiltered };
    }
    return saleObj;
};

/**
 * GET /api/sales
 * Get all sales for a store
 * Requires: x-store-id header
 */
router.get('/', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const { limit = 50, skip = 0, sortBy = 'createdAt', order = 'desc' } = req.query;

        // MUST filter by storeId
        const query = Sale.find({ storeId: req.storeId })
            .populate('productId', 'name sku costPrice sellingPrice')
            .populate('createdBy', 'name email')
            .limit(parseInt(limit))
            .skip(parseInt(skip))
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 });

        const sales = await query.lean();

        // Filter for staff role
        const filtered = sales.map(s => filterSaleForRole(s, req.currentStore.role));

        // Get total count
        const total = await Sale.countDocuments({ storeId: req.storeId });

        res.json({
            sales: filtered,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({ error: 'Failed to fetch sales' });
    }
});

/**
 * GET /api/sales/:id
 * Get single sale
 * Requires: x-store-id header
 */
router.get('/:id', authenticate, requireStoreAccess(), async (req, res) => {
    try {
        const sale = await Sale.findOne({
            _id: req.params.id,
            storeId: req.storeId
        })
            .populate('productId', 'name sku costPrice sellingPrice')
            .populate('createdBy', 'name email');

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        const filtered = filterSaleForRole(sale, req.currentStore.role);
        res.json(filtered);
    } catch (error) {
        console.error('Get sale error:', error);
        res.status(500).json({ error: 'Failed to fetch sale' });
    }
});

/**
 * POST /api/sales
 * Create a new sale (with MongoDB transaction for stock update)
 * Requires: x-store-id header
 */
router.post('/',
    authenticate,
    requireStoreAccess(),
    injectStoreMetadata,
    async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const {
                productId,
                quantity,
                sellingPrice,
                customerName
            } = req.body;

            if (!productId || !quantity || sellingPrice === undefined) {
                await session.abortTransaction();
                return res.status(400).json({
                    error: 'Product ID, quantity, and selling price are required'
                });
            }

            if (quantity <= 0) {
                await session.abortTransaction();
                return res.status(400).json({ error: 'Quantity must be greater than 0' });
            }

            // 1. Check product exists and has sufficient stock (within transaction)
            const product = await Product.findOne({
                _id: productId,
                storeId: req.storeId
            }).session(session);

            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ error: 'Product not found in this store' });
            }

            if (product.stock < quantity) {
                await session.abortTransaction();
                return res.status(400).json({
                    error: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
                });
            }

            // 2. Create sale (within transaction)
            const saleData = {
                storeId: req.storeId,
                productId,
                quantity,
                sellingPrice,
                totalAmount: quantity * sellingPrice,
                customerName,
                createdBy: req.user.id
            };

            const sale = await Sale.create([saleData], { session });

            // 3. Update product stock (within transaction)
            await Product.findByIdAndUpdate(
                productId,
                { $inc: { stock: -quantity } },
                { session, runValidators: true }
            );

            // Commit transaction
            await session.commitTransaction();

            // Populate and return
            const populatedSale = await Sale.findById(sale[0]._id)
                .populate('productId', 'name sku')
                .populate('createdBy', 'name email');

            res.status(201).json(populatedSale);

        } catch (error) {
            await session.abortTransaction();
            console.error('Create sale error:', error);
            res.status(500).json({ error: 'Failed to create sale' });
        } finally {
            session.endSession();
        }
    });

/**
 * DELETE /api/sales/:id
 * Delete sale and restore stock (admin/coadmin only)
 * Requires: x-store-id header
 */
router.delete('/:id',
    authenticate,
    requireStoreAccess(['admin', 'coadmin']),
    async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find sale
            const sale = await Sale.findOne({
                _id: req.params.id,
                storeId: req.storeId
            }).session(session);

            if (!sale) {
                await session.abortTransaction();
                return res.status(404).json({ error: 'Sale not found' });
            }

            // Restore stock
            await Product.findByIdAndUpdate(
                sale.productId,
                { $inc: { stock: sale.quantity } },
                { session }
            );

            // Delete sale
            await Sale.findByIdAndDelete(sale._id).session(session);

            await session.commitTransaction();
            res.json({ message: 'Sale deleted and stock restored successfully' });

        } catch (error) {
            await session.abortTransaction();
            console.error('Delete sale error:', error);
            res.status(500).json({ error: 'Failed to delete sale' });
        } finally {
            session.endSession();
        }
    });

export default router;
