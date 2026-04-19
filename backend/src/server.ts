import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/mongodb';
import authRoutes from './routes/auth';
import storesRoutes from './routes/stores';
import productsRoutes from './routes/products';
import purchasesRoutes from './routes/purchases';
import salesRoutes from './routes/sales';
import reportsRoutes from './routes/reports';
import guestRoutes from './routes/guest';
import type { Request, Response, NextFunction } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/guest', guestRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Multi-tenant Inventory Management API is running', database: 'MongoDB' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🏪 Multi-tenant SaaS mode enabled`);
    console.log(`🗄️  Database: MongoDB`);
});
