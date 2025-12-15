import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables for create-institution API');
}

const supabaseAdmin = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const payload = req.body || {};
  const institution = payload.institution;
  const admin = payload.admin;

  if (!institution || !admin) {
    res.status(400).json({ error: 'Missing institution or admin data' });
    return;
  }

  try {
    // 1) Create the auth user (confirmed)
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: { full_name: admin.full_name, role: 'admin' }
    } as any);

    if (createUserError) {
      console.error('Error creating auth user:', createUserError);
      return res.status(500).json({ error: createUserError.message || createUserError });
    }

    const user = (userData as any)?.user || userData;
    if (!user || !user.id) {
      return res.status(500).json({ error: 'Failed to create auth user' });
    }

    // 2) Create institution with admin_user_id set
    const { data: institutionData, error: instError } = await supabaseAdmin
      .from('institutions')
      .insert({
        name: institution.name,
        email: institution.email,
        website: institution.website || null,
        address: institution.address || null,
        phone: institution.phone || null,
        admin_user_id: user.id
      })
      .select()
      .single();

    if (instError) {
      console.error('Error creating institution:', instError);
      // rollback: delete the created user
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      } catch (e) {
        console.error('Failed to rollback user creation:', e);
      }
      return res.status(500).json({ error: instError.message || instError });
    }

    const institutionRow = institutionData;

    // 3) Create or upsert user profile linking to institution
    const profile = {
      id: user.id,
      full_name: admin.full_name || '',
      institution_id: institutionRow.id,
      role: 'admin'
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' });

    if (profileError) {
      console.error('Error upserting user profile:', profileError);
      return res.status(500).json({ error: profileError.message || profileError });
    }

    // Success
    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email }, institution: institutionRow });
  } catch (err: any) {
    console.error('Unexpected error in create-institution:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
