# 🚨 URGENT: Fix Infinite Recursion Error

## Problem
You're getting "infinite recursion detected in policy for relation user_profiles" when approving organizations as super admin.

## Cause
The RLS policies have circular dependencies:
- `user_profiles` policies check `super_admins` table
- Operations on `institutions` trigger checks on `user_profiles`
- This creates an infinite loop

## Solution

### Run This SQL Migration NOW:

1. **Open Supabase Dashboard**
   - Go to SQL Editor
   - Open: `supabase/migrations/20241214120000_fix_rls_recursion.sql`

2. **Copy and Run the Entire File**
   - This will drop the problematic policies
   - And recreate them without circular dependencies

3. **Test the Fix**
   - Try approving an organization again
   - Should work without recursion error

## What Changed

### Before (BROKEN):
```sql
-- This caused recursion:
CREATE POLICY ON user_profiles 
USING (
    EXISTS (
        SELECT 1 FROM super_admins 
        WHERE id = auth.uid()
    )
    -- When checking super_admins, it might reference user_profiles again
);
```

### After (FIXED):
```sql
-- Direct check, no recursion:
CREATE POLICY ON user_profiles 
USING (
    EXISTS (
        SELECT 1 FROM super_admins sa
        WHERE sa.id = auth.uid() 
        AND sa.is_active = true
    )
    -- Simple direct query, no circular reference
);
```

## Verify It Works

After running the migration, test:

1. **Login as super admin**
2. **Go to dashboard**
3. **Click "Approve" on a pending organization**
4. **Should succeed without errors**

The fix ensures RLS policies check permissions directly without creating circular dependencies.
