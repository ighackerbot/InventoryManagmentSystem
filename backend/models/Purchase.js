import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
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
    costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: [0, 'Cost price cannot be negative']
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    supplierName: {
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
purchaseSchema.index({ storeId: 1 }); // CRITICAL for isolation
purchaseSchema.index({ createdAt: -1 }); // For sorting by date
purchaseSchema.index({ storeId: 1, createdAt: -1 }); // Compound for filtered + sorted queries
purchaseSchema.index({ productId: 1 }); // For product-specific queries

// Calculate total amount before saving
purchaseSchema.pre('save', function (next) {
    if (this.isModified('quantity') || this.isModified('costPrice')) {
        this.totalAmount = this.quantity * this.costPrice;
    }
    next();
});

const Purchase = mongoose.model('Purchase', purchaseSchema);

export default Purchase;
