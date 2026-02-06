import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireStoreAccess } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';

const router = express.Router();

// Get all users in a store (admin only)
router.get('/:storeId/users', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('user_store_roles')
            .select(`
                id,
                role,
                created_at,
                user_id,
                users:user_id (
                    email
                )
            `)
            .eq('store_id', req.storeId);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Format response
        const formattedUsers = users.map(u => ({
            id: u.id,
            user_id: u.user_id,
            email: u.users?.email,
            role: u.role,
            created_at: u.created_at
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Get store users error:', error);
        res.status(500).json({ error: 'Failed to fetch store users' });
    }
});

// Invite user to store (admin only)
router.post('/:storeId/users', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        if (!['admin', 'coadmin', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Find user by email (note: this requires RLS policy adjustment or service role)
        // For now, we'll assume the user exists and we have their ID
        // In production, you might want to send an invitation email instead

        const { data: userData, error: userError } = await supabase.rpc(
            'get_user_by_email',
            { user_email: email }
        );

        if (userError || !userData) {
            return res.status(404).json({
                error: 'User not found. User must sign up first before being added to a store.'
            });
        }

        // Check if user already has access to this store
        const { data: existing } = await supabase
            .from('user_store_roles')
            .select('id')
            .eq('store_id', req.storeId)
            .eq('user_id', userData.id)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'User already has access to this store' });
        }

        // Add user to store
        const { data: userRole, error: roleError } = await supabase
            .from('user_store_roles')
            .insert([{
                user_id: userData.id,
                store_id: req.storeId,
                role: role
            }])
            .select()
            .single();

        if (roleError) {
            return res.status(400).json({ error: roleError.message });
        }

        // Log audit
        await logAudit(
            req.user.id,
            req.storeId,
            'CREATE',
            'user_store_role',
            userRole.id,
            null,
            { user_id: userData.id, role: role }
        );

        res.status(201).json({
            id: userRole.id,
            user_id: userData.id,
            email: email,
            role: role
        });
    } catch (error) {
        console.error('Add user to store error:', error);
        res.status(500).json({ error: 'Failed to add user to store' });
    }
});

// Update user role in store (admin only)
router.put('/:storeId/users/:userId/role', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'coadmin', 'staff'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required' });
        }

        // Get old role for audit
        const { data: oldData } = await supabase
            .from('user_store_roles')
            .select('role')
            .eq('store_id', req.storeId)
            .eq('user_id', userId)
            .single();

        const { data: updated, error } = await supabase
            .from('user_store_roles')
            .update({ role })
            .eq('store_id', req.storeId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Log role change
        await logAudit(
            req.user.id,
            req.storeId,
            'ROLE_CHANGE',
            'user_store_role',
            updated.id,
            { role: oldData?.role },
            { role: role }
        );

        res.json(updated);
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// Remove user from store (admin only)
router.delete('/:storeId/users/:userId', authenticate, requireStoreAccess(['admin']), async (req, res) => {
    try {
        const { userId } = req.params;

        // Prevent removing the store owner
        const { data: store } = await supabase
            .from('stores')
            .select('owner_id')
            .eq('id', req.storeId)
            .single();

        if (store.owner_id === userId) {
            return res.status(400).json({ error: 'Cannot remove store owner' });
        }

        // Get data for audit before deletion
        const { data: roleData } = await supabase
            .from('user_store_roles')
            .select('*')
            .eq('store_id', req.storeId)
            .eq('user_id', userId)
            .single();

        const { error } = await supabase
            .from('user_store_roles')
            .delete()
            .eq('store_id', req.storeId)
            .eq('user_id', userId);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Log audit
        if (roleData) {
            await logAudit(
                req.user.id,
                req.storeId,
                'DELETE',
                'user_store_role',
                roleData.id,
                roleData,
                null
            );
        }

        res.json({ message: 'User removed from store successfully' });
    } catch (error) {
        console.error('Remove user from store error:', error);
        res.status(500).json({ error: 'Failed to remove user from store' });
    }
});

export default router;
