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
            values: [
                'Warehouse & Logistics',
                'Retail Shop',
                'Godown',
                'Branch',
                'Distribution Center',
                // Legacy values for backward compatibility
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
    },
    adminPin: {
        type: String,
        trim: true
        // Set by admin during signup, used by co-admin/staff to join this store
    },
    teamCapacity: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});


const Store = mongoose.model('Store', storeSchema);

export default Store;
