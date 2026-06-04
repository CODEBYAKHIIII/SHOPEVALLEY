import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize Supabase with SERVICE ROLE key (admin access)
// This should only be available on the backend, never expose to client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('Missing Supabase admin credentials. Some features will be unavailable.');
}

const supabaseAdmin = SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY) : null;

/**
 * POST /api/admin/create-account
 * Creates an admin account (requires special authorization)
 */
app.post('/api/admin/create-account', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Admin API not configured' });
  }

  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create auth user with admin service
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Verify email immediately
      user_metadata: {
        role: 'ADMIN'
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Create profile entry
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name,
        phone: null,
        role: 'ADMIN',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: 'Failed to create profile' });
    }

    return res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'ADMIN'
      }
    });
  } catch (error: any) {
    console.error('Admin creation error:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/send-otp
 * Simulates sending OTP (in real app, use email service)
 */
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In production, send via email service
    console.log(`[OTP] ${email}: ${otp}`);

    // For demo, we'll return it (NEVER do this in production)
    return res.status(200).json({
      success: true,
      message: 'OTP sent',
      // Demo only - remove in production
      demo_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`);
});

export default app;
