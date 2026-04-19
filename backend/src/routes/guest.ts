import express, { Request, Response } from 'express';
import User from '../models/User.js';
import Store from '../models/Store.js';
import UserStoreRole from '../models/UserStoreRole.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import { createAuthResponse } from '../utils/jwt.js';

const router = express.Router();

interface DemoProduct {
    name: string; sku: string; description: string;
    stock: number; costPrice: number; sellingPrice: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
    { name: 'MacBook Pro 14"', sku: 'DEMO-001', description: 'Apple MacBook Pro with M3 chip', stock: 12, costPrice: 175000, sellingPrice: 199900 },
    { name: 'iPhone 15 Pro', sku: 'DEMO-002', description: '256GB, Natural Titanium', stock: 25, costPrice: 115000, sellingPrice: 134900 },
    { name: 'Sony WH-1000XM5', sku: 'DEMO-003', description: 'Wireless Noise Cancelling Headphones', stock: 40, costPrice: 22000, sellingPrice: 29990 },
    { name: 'USB-C Fast Charger', sku: 'DEMO-004', description: '65W GaN USB-C Charger', stock: 100, costPrice: 1200, sellingPrice: 2499 },
    { name: 'Logitech MX Master 3S', sku: 'DEMO-005', description: 'Wireless Ergonomic Mouse', stock: 35, costPrice: 6500, sellingPrice: 8995 }
];

/** POST /api/guest/start */
router.post('/start', async (_req: Request, res: Response): Promise<void> => {
    try {
        const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const email = `${guestId}@temp.local`;

        const user = new User({ name: 'Guest User', email, passwordHash: guestId, roleType: 'admin' });
        await user.save();

        const store = new Store({ name: 'Guest Demo Store', type: 'Retail Shop', ownerId: user._id, currency: 'INR', taxPercent: 0, teamCapacity: 10 });
        await store.save();

        await new UserStoreRole({ userId: user._id, storeId: store._id, role: 'admin' }).save();

        const createdProducts: Array<{ _id: unknown; sellingPrice: number }> = [];
        for (const p of DEMO_PRODUCTS) {
            const product = new Product({ ...p, storeId: store._id });
            await product.save();
            createdProducts.push({ _id: product._id, sellingPrice: product.sellingPrice });
        }

        if (createdProducts.length >= 2) {
            await Sale.create([
                { storeId: store._id, productId: createdProducts[0]._id, quantity: 1, sellingPrice: createdProducts[0].sellingPrice, totalAmount: createdProducts[0].sellingPrice, customerName: 'Demo Customer A', createdBy: user._id, createdAt: new Date(Date.now() - 86400000) },
                { storeId: store._id, productId: createdProducts[1]._id, quantity: 2, sellingPrice: createdProducts[1].sellingPrice, totalAmount: createdProducts[1].sellingPrice * 2, customerName: 'Demo Customer B', createdBy: user._id, createdAt: new Date(Date.now() - 2 * 86400000) }
            ]);
        }

        const authResponse = createAuthResponse(user);
        res.status(201).json({ ...authResponse, message: 'Guest session created successfully', stores: [{ id: store._id, name: store.name, type: store.type, role: 'admin', currency: store.currency }] });
    } catch (error) {
        console.error('Guest start error:', (error as Error).message);
        res.status(500).json({ error: 'Failed to create guest session' });
    }
});

export default router;
