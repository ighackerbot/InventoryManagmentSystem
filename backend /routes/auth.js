import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, role = 'staff' } = req.body;

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        // Create profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    email,
                    role: role === 'admin' ? 'admin' : 'staff', // Only allow admin via direct DB or existing admin
                },
            ])
            .select()
            .single();

        if (profileError) {
            return res.status(400).json({ error: 'Failed to create profile' });
        }

        res.status(201).json({
            user: authData.user,
            session: authData.session,
            profile,
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Signup failed' });
    }
});

// Sign in
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            return res.status(400).json({ error: 'Profile not found' });
        }

        res.json({
            user: data.user,
            session: data.session,
            profile,
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Signin failed' });
    }
});

// Sign out
router.post('/signout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            await supabase.auth.signOut(token);
        }
        res.json({ message: 'Signed out successfully' });
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ error: 'Signout failed' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7);

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            return res.status(400).json({ error: 'Profile not found' });
        }

        res.json({ user, profile });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
