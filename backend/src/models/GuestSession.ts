import mongoose, { Document, Schema, Model } from 'mongoose';

interface IGuestProduct {
    name: string;
    sku?: string;
    category?: string;
    price: number;
    costPrice: number;
    stock: number;
    unit: string;
    description?: string;
}

interface IGuestSale {
    productName?: string;
    quantity: number;
    totalAmount: number;
    createdAt: Date;
}

export interface IGuestSession extends Document {
    guestId: string;
    products: IGuestProduct[];
    sales: IGuestSale[];
    createdAt: Date;
}

const guestProductSchema = new Schema<IGuestProduct>({
    name: { type: String, required: true },
    sku: { type: String },
    category: { type: String },
    price: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: 'pcs' },
    description: { type: String }
}, { _id: true });

const guestSaleSchema = new Schema<IGuestSale>({
    productName: { type: String },
    quantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const guestSessionSchema = new Schema<IGuestSession>({
    guestId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    products: [guestProductSchema],
    sales: [guestSaleSchema],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // TTL: 24 hours
    }
});

const GuestSession: Model<IGuestSession> = mongoose.model<IGuestSession>('GuestSession', guestSessionSchema);
export default GuestSession;
