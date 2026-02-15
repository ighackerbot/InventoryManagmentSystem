import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true // CRITICAL for multi-tenant isolation
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product ID is required']
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1']
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Selling price cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    customerName: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required']
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
saleSchema.index({ storeId: 1 }); // CRITICAL for isolation
saleSchema.index({ createdAt: -1 }); // For sorting by date
saleSchema.index({ storeId: 1, createdAt: -1 }); // Compound for filtered + sorted queries
saleSchema.index({ productId: 1 }); // For product-specific queries

// Calculate total amount before saving
saleSchema.pre('save', function (next) {
    if (this.isModified('quantity') || this.isModified('sellingPrice')) {
        this.totalAmount = this.quantity * this.sellingPrice;
    }
    next();
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
