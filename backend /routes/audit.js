import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';

const router = express.Router();

// Get audit logs for a store (admin only)
router.get('/:storeId/logs', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const {
            action,
            entity_type,
            start_date,
            end_date,
            limit = 50,
            offset = 0
        } = req.query;

        let query = supabase
            .from('audit_logs')
            .select('*')
            .eq('store_id', req.storeId)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1);

        if (action) {
            query = query.eq('action', action);
        }
        if (entity_type) {
            query = query.eq('entity_type', entity_type);
        }
        if (start_date) {
            query = query.gte('timestamp', start_date);
        }
        if (end_date) {
            query = query.lte('timestamp', end_date);
        }

        const { data, error, count } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({
            logs: data,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: count
            }
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Get audit log summary (admin only)
router.get('/:storeId/logs/summary', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        let query = supabase
            .from('audit_logs')
            .select('action, entity_type')
            .eq('store_id', req.storeId);

        if (start_date) {
            query = query.gte('timestamp', start_date);
        }
        if (end_date) {
            query = query.lte('timestamp', end_date);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Aggregate by action and entity type
        const summary = data.reduce((acc, log) => {
            const key = `${log.action}_${log.entity_type}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        res.json({
            summary,
            total: data.length
        });
    } catch (error) {
        console.error('Get audit summary error:', error);
        res.status(500).json({ error: 'Failed to fetch audit summary' });
    }
});

export default router;
