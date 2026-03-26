import mongoose from 'mongoose';

const guestProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String },
    category: { type: String },
    price: { type: Number, default: 0 },
    costPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    unit: { type: String, default: 'pcs' },
    description: { type: String }
}, { _id: true });

const guestSaleSchema = new mongoose.Schema({
    productName: { type: String },
    quantity: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const guestSessionSchema = new mongoose.Schema({
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
        expires: 86400 // TTL: auto-delete after 24 hours (in seconds)
    }
});

const GuestSession = mongoose.model('GuestSession', guestSessionSchema);

export default GuestSession;
