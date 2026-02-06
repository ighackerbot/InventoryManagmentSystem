import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import storesRoutes from './routes/stores.js';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import purchasesRoutes from './routes/purchases.js';
import salesRoutes from './routes/sales.js';
import reportsRoutes from './routes/reports.js';
import exportRoutes from './routes/export.js';
import auditRoutes from './routes/audit.js';
import alertsRoutes from './routes/alerts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server + additional origins
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storesRoutes);
app.use('/api/stores', usersRoutes); // User management is nested under stores
app.use('/api/stores', exportRoutes); // Export is nested under stores
app.use('/api/stores', auditRoutes); // Audit logs nested under stores
app.use('/api/alerts', alertsRoutes); // Alerts with store ID in path
app.use('/api/products', productsRoutes);
app.use('/api/purchases', purchasesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Multi-tenant Inventory Management API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🏪 Multi-tenant SaaS mode enabled`);
});
