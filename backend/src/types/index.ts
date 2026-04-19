import type { Request, Response, NextFunction } from 'express';

// ─── Role Types ───────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'coadmin' | 'staff';

export type OAuthProvider = 'google' | 'github' | null;

// ─── Auth types attached to Express Request ───────────────────────────────────

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    roleType: UserRole;
}

export interface StoreInfo {
    name: string;
    type: string;
    ownerId: string;
    currency: string;
    taxPercent: number;
}

export interface StoreAccess {
    store_id: string;
    role: UserRole;
    stores: StoreInfo;
}

// ─── Express Request Augmentation ─────────────────────────────────────────────

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            userStores?: StoreAccess[];
            currentStore?: StoreAccess;
            storeId?: string;
            oldValues?: Record<string, unknown>;
        }
    }
}

// ─── API Response types ───────────────────────────────────────────────────────

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        roleType: UserRole;
        createdAt?: Date;
    };
}

export interface StoreResponse {
    id: string;
    name: string;
    type: string;
    role: UserRole;
    currency?: string;
}

// ─── Middleware types ─────────────────────────────────────────────────────────

export type AsyncMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<void | Response>;

export type MiddlewareFactory<T = void> = (
    ...args: T extends void ? [] : [T]
) => AsyncMiddleware;

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
    id: string;
    email: string;
    roleType: UserRole;
    iat?: number;
    exp?: number;
}
