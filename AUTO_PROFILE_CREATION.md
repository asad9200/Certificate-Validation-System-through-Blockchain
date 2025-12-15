# 🔧 Automatic User Profile Creation - Complete Fix

## Problem
User profiles weren't being created during signup, causing login failures with error `PGRST116: The result contains 0 rows`.

## Solution: 3-Layer Defense

### Layer 1: Database Trigger (MOST IMPORTANT) ✅
**Automatically creates user_profiles for EVERY new user**

Run this migration:
```
supabase/migrations/20241214140000_auto_create_profiles.sql
```

**What it does:**
- Triggers AFTER every new user is created in `auth.users`
- Reads metadata (full_name, institution_id, role, user_type)
- Automatically inserts into `user_profiles`
- Works for both super admins and institution users
- **SECURITY DEFINER** = bypasses RLS, always works!

### Layer 2: Backfill Existing Users
The same migration includes a script to **fix all existing users** who are missing profiles.

### Layer 3: Client-Side (Already Done)
The `signUp()` function in `auth-service.ts` also tries to create the profile, but if RLS blocks it, the trigger ensures it still happens.

## How to Apply

### Step 1: Run the Migration
```bash
# In Supabase SQL Editor, copy and run:
supabase/migrations/20241214140000_auto_create_profiles.sql
```

### Step 2: Verify It Worked
The migration includes a verification query at the end that shows:
```
email                    | status       | institution_name
-------------------------|--------------|------------------
admin@test.com          | ✅ HAS PROFILE | Test University
```

### Step 3: Test New Signup
1. Sign up a new institution
2. Check that user_profile was created automatically
3. Login should work immediately!

## What the Trigger Does (Technical)

```sql
NEW USER CREATED
      ↓
auth.users INSERT
      ↓
TRIGGER FIRES (after insert)
      ↓
Read: raw_user_meta_data
  - full_name
  - institution_id
  - role
  - user_type
      ↓
INSERT into user_profiles
  (using SECURITY DEFINER - bypasses RLS)
      ↓
✅ Profile Created!
```

## Benefits

1. **No More Missing Profiles** - Every user gets one automatically
2. **Fixes Existing Users** - Backfill script creates profiles for anyone missing them
3. **RLS-Proof** - SECURITY DEFINER bypasses RLS policies
4. **Future-Proof** - Works for all future signups forever
5. **Zero Code Changes** - No frontend changes needed

## Verification

After running the migration, check:

```sql
-- Should return NO missing profiles
SELECT au.email
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
WHERE up.id IS NULL;
```

## One-Time Fix for Your Current User

If the backfill didn't work, manually run:

```sql
-- Get your IDs first
SELECT id FROM auth.users WHERE email = 'your@email.com';
SELECT id FROM institutions WHERE email = 'institution@email.com';

-- Then insert
INSERT INTO user_profiles (id, full_name, user_type, institution_id, role, is_active)
VALUES (
    'YOUR_USER_ID'::uuid,
    'Your Name',
    'institution_user',
    'INSTITUTION_ID'::uuid,
    'admin',
    true
);
```

Now login should work, and all future signups will work automatically! 🎉
