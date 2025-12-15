# 🔥 Complete RLS Rebuild - Final Fix

## The Problem
The recursion error persists because the policies in the original migration have circular dependencies that can't be fixed by just dropping some policies.

## The Solution
**Complete rebuild of ALL RLS policies using helper functions**

### Run This Migration:
```
supabase/migrations/20241214130000_complete_rls_rebuild.sql
```

## What's Different This Time

### Old Approach (CAUSES RECURSION):
```sql
-- Policy directly queries user_profiles
CREATE POLICY ON institutions 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles  -- ← Can cause recursion
        WHERE user_type = 'super_admin'
    )
);
```

### New Approach (NO RECURSION):
```sql
-- Helper function with SECURITY DEFINER
CREATE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER  -- ← Runs with elevated privileges, avoids RLS
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM super_admins
        WHERE id = user_id
    );
END;
$$;

-- Policy uses helper function
CREATE POLICY ON institutions 
USING (is_super_admin(auth.uid()));  -- ← No recursion!
```

## What This Migration Does

1. **Drops ALL policies** from all tables
2. **Creates 2 helper functions:**
   - `is_super_admin(user_id)` - Check if user is super admin
   - `get_user_institution(user_id)` - Get user's institution ID
3. **Rebuilds ALL policies** using these functions
4. **Zero circular dependencies**

## Steps to Apply

### 1. Open Supabase SQL Editor
Go to your project dashboard

### 2. Copy the ENTIRE migration file
```
supabase/migrations/20241214130000_complete_rls_rebuild.sql
```

### 3. Paste and Run
Click "Run" or press Ctrl+Enter

### 4. Verify Success
You should see:
```
Success. No rows returned
```

### 5. Test Immediately
1. Refresh super admin dashboard
2. Click "Approve" on a pending organization
3. Should work WITHOUT recursion error! ✅

## Why This Works

**SECURITY DEFINER** functions run with the permissions of the function owner (bypassing RLS), which breaks the recursion cycle:

- When you approve an org: `institutions` UPDATE triggered
- Policy checks: `is_super_admin(auth.uid())`
- Function runs with DEFINER privileges (no RLS)
- Directly queries `super_admins` table
- Returns true/false
- No recursion! ✅

## Still Having Issues?

If you still get recursion errors:

1. **Check the migration ran completely:**
   ```sql
   SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';
   ```
   Should return ~16 policies

2. **Verify functions exist:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname IN ('is_super_admin', 'get_user_institution');
   ```
   Should return 2 rows

3. **Clear browser cache and re-login**

This is the definitive fix for the recursion issue!
