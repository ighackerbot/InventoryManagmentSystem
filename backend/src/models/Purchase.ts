import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IPurchase extends Document {
    storeId: Types.ObjectId;
    productId: Types.ObjectId;
    quantity: number;
    costPrice: number;
    totalAmount: number;
    supplierName?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
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
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Created by is required']
    }
}, { timestamps: true });

purchaseSchema.index({ storeId: 1, createdAt: -1 });
purchaseSchema.index({ createdAt: -1 });
purchaseSchema.index({ productId: 1 });

purchaseSchema.pre<IPurchase>('save', function (next) {
    if (this.isModified('quantity') || this.isModified('costPrice')) {
        this.totalAmount = this.quantity * this.costPrice;
    }
    next();
});

const Purchase: Model<IPurchase> = mongoose.model<IPurchase>('Purchase', purchaseSchema);
export default Purchase;
