import type { Request, Response, NextFunction } from 'express';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * Audit logging middleware stub (Supabase removed — no-op for MongoDB version)
 */
export const auditLog = (_action: AuditAction, _entityType: string) => {
    return (_req: Request, _res: Response, next: NextFunction): void => {
        // Audit logging was tied to Supabase; this is now a no-op stub.
        // To re-enable, integrate with a MongoDB audit_logs collection.
        next();
    };
};

/**
 * Middleware to capture old values before update/delete (stub)
 */
export const captureOldValues = (_tableName: string) => {
    return (_req: Request, _res: Response, next: NextFunction): void => {
        next();
    };
};

/**
 * Helper function to manually log audit events (stub)
 */
export const logAudit = async (
    _userId: string,
    _storeId: string,
    _action: AuditAction,
    _entityType: string,
    _entityId: string,
    _oldValues: Record<string, unknown> | null = null,
    _newValues: Record<string, unknown> | null = null
): Promise<void> => {
    // No-op stub — implement with MongoDB collection if needed
};

export default { auditLog, captureOldValues, logAudit };
