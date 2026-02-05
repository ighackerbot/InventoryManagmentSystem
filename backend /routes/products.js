import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
    try {
        const { search, sortBy = 'name', order = 'asc' } = req.query;

        let query = supabase
            .from('products')
            .select('*');

        if (search) {
            query = query.ilike('name', `%${search}%`);
        }

        query = query.order(sortBy, { ascending: order === 'asc' });

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create product (admin/coadmin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;

        const { data, error } = await supabase
            .from('products')
            .insert([{ name, description, price, stock }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (admin/coadmin only)
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock } = req.body;

        const { data, error } = await supabase
            .from('products')
            .update({ name, description, price, stock })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json(data);
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (admin/coadmin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

export default router;
