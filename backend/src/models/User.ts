import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { UserRole, OAuthProvider } from '../types/index.js';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    roleType: UserRole;
    oauthProvider: OAuthProvider;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required'],
        select: false
    },
    roleType: {
        type: String,
        enum: ['admin', 'coadmin', 'staff'] as UserRole[],
        default: 'staff' as UserRole
    },
    oauthProvider: {
        type: String,
        enum: ['google', 'github', null],
        default: null
    }
}, { timestamps: true });

userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.passwordHash;
    return obj;
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
export default User;
