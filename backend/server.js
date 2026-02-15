import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/mongodb.js';

// Route imports
import authRoutes from './routes/auth.js';
import storesRoutes from './routes/stores.js';
import productsRoutes from './routes/products.js';
import purchasesRoutes from './routes/purchases.js';
import salesRoutes from './routes/sales.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = [
    'http://localhost:5174',
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Multi-tenant Inventory Management API is running',
        database: 'MongoDB'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🏪 Multi-tenant SaaS mode enabled`);
    console.log(`🗄️  Database: MongoDB`);
});
