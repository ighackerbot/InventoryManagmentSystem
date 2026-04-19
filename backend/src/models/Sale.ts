import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISale extends Document {
    storeId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    sellingPrice: number;
    totalAmount: number;
    customerName?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const saleSchema = new Schema<ISale>({
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true
    },
    productId: {
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required']
    }
}, { timestamps: true });

saleSchema.index({ storeId: 1, createdAt: -1 });
saleSchema.index({ createdAt: -1 });
saleSchema.index({ productId: 1 });

saleSchema.pre<ISale>('save', function (next) {
    if (this.isModified('quantity') || this.isModified('sellingPrice')) {
        this.totalAmount = this.quantity * this.sellingPrice;
    }
    next();
});

const Sale: Model<ISale> = mongoose.model<ISale>('Sale', saleSchema);
export default Sale;
