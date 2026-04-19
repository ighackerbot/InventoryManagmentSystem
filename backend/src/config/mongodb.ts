import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory_management';

export const connectDB = async (retries = 5): Promise<typeof mongoose | void> => {
    for (let i = 0; i < retries; i++) {
        try {
            const conn = await mongoose.connect(MONGODB_URI);

            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`📦 Database: ${conn.connection.name}`);

            mongoose.connection.on('error', (err: Error) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB disconnected');
            });

            return conn;
        } catch (error) {
            const err = error as Error;
            console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
            if (i < retries - 1) {
                const delay = Math.min(5000 * (i + 1), 15000);
                console.log(`⏳ Retrying in ${delay / 1000}s...`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                console.error('❌ All MongoDB connection attempts failed.');
            }
        }
    }
};

export default mongoose;
