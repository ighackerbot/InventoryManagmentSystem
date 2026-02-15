import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true // CRITICAL for multi-tenant isolation
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    sku: {
        type: String,
        trim: true,
        sparse: true // Allows multiple null values
    },
    description: {
        type: String,
        trim: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Stock cannot be negative']
    },
    costPrice: {
        type: Number,
        required: [true, 'Cost price is required'],
        min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: [0, 'Selling price cannot be negative']
    },
    lowStockThreshold: {
        type: Number,
        default: 10,
        min: [0, 'Low stock threshold cannot be negative']
    }
}, {
    timestamps: true
});

productSchema.index({ storeId: 1, sku: 1 }, { unique: true, sparse: true });

// Virtual for low stock check
productSchema.virtual('isLowStock').get(function () {
    return this.stock <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
