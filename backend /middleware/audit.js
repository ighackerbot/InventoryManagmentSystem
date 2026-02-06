import { supabase } from '../config/supabase.js';

/**
 * Audit logging middleware
 * Logs CREATE, UPDATE, DELETE operations to audit_logs table
 */
export const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        // Store original methods
        const originalJson = res.json.bind(res);
        const originalSend = res.send.bind(res);

        // Override response methods to capture successful operations
        const captureResponse = async (data) => {
            // Only log if operation was successful (2xx status)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const logData = {
                        user_id: req.user?.id,
                        store_id: req.storeId || req.body?.store_id,
                        action: action,
                        entity_type: entityType,
                        entity_id: data?.id || req.params?.id,
                        new_values: action !== 'DELETE' ? data : null,
                        old_values: req.oldValues || null
                    };

                    await supabase
                        .from('audit_logs')
                        .insert([logData]);
                } catch (error) {
                    console.error('Audit logging error:', error);
                    // Don't fail the request if audit log fails
                }
            }
            return data;
        };

        res.json = async function (data) {
            await captureResponse(data);
            return originalJson(data);
        };

        res.send = async function (data) {
            await captureResponse(data);
            return originalSend(data);
        };

        next();
    };
};

/**
 * Middleware to capture old values before update/delete
 */
export const captureOldValues = (tableName) => {
    return async (req, res, next) => {
        const id = req.params.id;

        if (!id) {
            return next();
        }

        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', id)
                .single();

            if (!error && data) {
                req.oldValues = data;
            }
        } catch (error) {
            console.error('Error capturing old values:', error);
        }

        next();
    };
};

/**
 * Helper function to manually log audit events
 */
export const logAudit = async (userId, storeId, action, entityType, entityId, oldValues = null, newValues = null) => {
    try {
        await supabase
            .from('audit_logs')
            .insert([{
                user_id: userId,
                store_id: storeId,
                action: action,
                entity_type: entityType,
                entity_id: entityId,
                old_values: oldValues,
                new_values: newValues
            }]);
    } catch (error) {
        console.error('Manual audit log error:', error);
    }
};
