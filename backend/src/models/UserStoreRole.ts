import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import type { UserRole } from '../types/index.js';

export interface IUserStoreRole extends Document {
    userId: Types.ObjectId;
    storeId: Types.ObjectId;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}

const userStoreRoleSchema = new Schema<IUserStoreRole>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: [true, 'Store ID is required'],
        index: true
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: {
            values: ['admin', 'coadmin', 'staff'] as UserRole[],
            message: 'Role must be admin, coadmin, or staff'
        }
    }
}, { timestamps: true });

// Ensure a user can only have one role per store
userStoreRoleSchema.index({ userId: 1, storeId: 1 }, { unique: true });

const UserStoreRole: Model<IUserStoreRole> = mongoose.model<IUserStoreRole>('UserStoreRole', userStoreRoleSchema);
export default UserStoreRole;
