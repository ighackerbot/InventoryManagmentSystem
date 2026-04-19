import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type StoreType =
    | 'Warehouse & Logistics'
    | 'Retail Shop'
    | 'Godown'
    | 'Branch'
    | 'Distribution Center'
    | 'shop'
    | 'godown'
    | 'branch';

export interface IStore extends Document {
    name: string;
    type: StoreType;
    address?: string;
    ownerId: Types.ObjectId;
    currency: string;
    taxPercent: number;
    adminPin?: string;
    teamCapacity: number;
    createdAt: Date;
    updatedAt: Date;
}

const storeSchema = new Schema<IStore>({
    name: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Store type is required'],
        enum: {
            values: [
                'Warehouse & Logistics',
                'Retail Shop',
                'Godown',
                'Branch',
                'Distribution Center',
                'shop',
                'godown',
                'branch'
            ],
            message: 'Invalid store type'
        }
    },
    address: {
        type: String,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Owner ID is required'],
        index: true
    },
    currency: {
        type: String,
        default: 'INR',
        uppercase: true
    },
    taxPercent: {
        type: Number,
        default: 0,
        min: [0, 'Tax percent cannot be negative'],
        max: [100, 'Tax percent cannot exceed 100']
    },
    adminPin: {
        type: String,
        trim: true
    },
    teamCapacity: {
        type: Number,
        default: 50
    }
}, { timestamps: true });

const Store: Model<IStore> = mongoose.model<IStore>('Store', storeSchema);
export default Store;
