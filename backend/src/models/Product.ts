import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IProduct extends Document {
    storeId: Types.ObjectId;
    name: string;
    sku?: string;
    description?: string;
    stock: number;
    costPrice: number;
    sellingPrice: number;
    lowStockThreshold: number;
    isLowStock?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>({
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    sku: {
        type: String,
        trim: true,
        sparse: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true,
        default: 'General'
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
}, { timestamps: true });

productSchema.index({ storeId: 1, sku: 1 }, { unique: true, sparse: true });

productSchema.virtual('isLowStock').get(function (this: IProduct) {
    return this.stock <= this.lowStockThreshold;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);
export default Product;
