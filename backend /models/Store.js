import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Store type is required'],
        enum: {
            values: ['shop', 'godown', 'branch'],
            message: 'Type must be shop, godown, or branch'
        }
    },
    address: {
        type: String,
        trim: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
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
    }
}, {
    timestamps: true
});

// Index for faster owner queries
storeSchema.index({ ownerId: 1 });

const Store = mongoose.model('Store', storeSchema);

export default Store;
