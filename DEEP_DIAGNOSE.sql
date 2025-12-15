-- =====================================================
-- 🕵️ DEEP DIAGNOSTIC & FIX
-- =====================================================

-- 1. List ALL users in the system (limit 20)
-- If this list is empty, your database is empty!
SELECT 
    id, 
    email, 
    created_at, 
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 20;

-- 2. Check if the specific ID exists
SELECT * 
FROM auth.users 
WHERE id = '444b972c-abe4-43ac-88ae-88a40943da04';

-- 3. Check if the institution exists
-- Replace this email with your institution email if known
SELECT * FROM institutions WHERE email LIKE '%@%'; 

-- =====================================================
-- IF QUERY 1 IS EMPTY:
-- Your database is empty. The ID "444b97..." is a ghost
-- from your browser cache (Stale Session).
--
-- FIX:
-- 1. Clear Browser Cache / Local Storage
-- 2. Sign Up again as a NEW user
-- =====================================================
