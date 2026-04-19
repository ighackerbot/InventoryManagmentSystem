import jwt from 'jsonwebtoken';
import type { JwtPayload, AuthResponse, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token for a user
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE } as jwt.SignOptions);
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        const err = error as jwt.JsonWebTokenError;
        if (err.name === 'TokenExpiredError') throw new Error('Token has expired');
        if (err.name === 'JsonWebTokenError') throw new Error('Invalid token');
        throw error;
    }
};

/**
 * Create authentication response with token and user data
 */
export const createAuthResponse = (user: {
    _id: unknown;
    email: string;
    name: string;
    roleType: UserRole;
    createdAt?: Date;
}): AuthResponse => {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
        id: String(user._id),
        email: user.email,
        roleType: user.roleType
    };

    const token = generateToken(payload);

    return {
        token,
        user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            roleType: user.roleType,
            createdAt: user.createdAt
        }
    };
};

export default { generateToken, verifyToken, createAuthResponse };
