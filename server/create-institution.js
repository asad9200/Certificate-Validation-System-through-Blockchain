// Simple Express server to create an institution + confirmed admin user
// Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env, then run `node server/create-institution.js`
// This is a local/dev helper. For production deploy as a serverless function and protect the key.

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(bodyParser.json());

// POST /create-institution
// body: { institution: { name,email,website?,address?,phone? }, admin: { email, password, full_name } }
app.post('/create-institution', async (req, res) => {
  try {
    const { institution, admin } = req.body;
    if (!institution || !admin) return res.status(400).json({ error: 'Missing institution or admin data' });

    // 1) Create confirmed auth user (admin)
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      user_metadata: { full_name: admin.full_name },
      email_confirm: true
    });

    if (createUserError) {
      console.error('Failed to create user:', createUserError);
      return res.status(500).json({ error: createUserError.message || createUserError });
    }

    const userId = userData.id;

    // 2) Insert institution with admin_user_id set to created user
    const institutionRow = {
      name: institution.name,
      email: institution.email,
      website: institution.website || null,
      address: institution.address || null,
      phone: institution.phone || null,
      admin_user_id: userId
    };

    const { data: instData, error: instError } = await supabaseAdmin
      .from('institutions')
      .insert(institutionRow)
      .select()
      .single();

    if (instError) {
      console.error('Failed to create institution:', instError);
      return res.status(500).json({ error: instError.message || instError });
    }

    const institutionId = instData.id;

    // 3) Upsert user profile linking to institution
    const profileRow = {
      id: userId,
      full_name: admin.full_name || null,
      institution_id: institutionId,
      role: 'admin'
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profileRow, { onConflict: 'id' });

    if (profileError) {
      console.error('Failed to upsert profile:', profileError);
      return res.status(500).json({ error: profileError.message || profileError });
    }

    return res.json({ user: userData, institution: instData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || err });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`create-institution server listening on http://localhost:${port}`));
