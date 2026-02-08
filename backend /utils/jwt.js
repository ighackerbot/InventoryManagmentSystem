import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Generate JWT token for a user
 * @param {Object} payload - User data to encode in token
 * @returns {String} JWT token
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

/**
 * Verify and decode JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

/**
 * Create authentication response with token and user data
 * @param {Object} user - User object from database
 * @returns {Object} Auth response with token and user
 */
export const createAuthResponse = (user) => {
    const payload = {
        id: user._id.toString(),
        email: user.email,
        roleType: user.roleType
    };

    const token = generateToken(payload);

    return {
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            roleType: user.roleType,
            createdAt: user.createdAt
        }
    };
};

export default {
    generateToken,
    verifyToken,
    createAuthResponse
};
