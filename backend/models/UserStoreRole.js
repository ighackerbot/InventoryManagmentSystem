import mongoose from 'mongoose';

const userStoreRoleSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['admin', 'coadmin', 'staff'],
            message: 'Role must be admin, coadmin, or staff'
        }
    }
}, {
    timestamps: true
});

// Compound index to ensure a user can only have one role per store
userStoreRoleSchema.index({ userId: 1, storeId: 1 }, { unique: true });

const UserStoreRole = mongoose.model('UserStoreRole', userStoreRoleSchema);

export default UserStoreRole;
