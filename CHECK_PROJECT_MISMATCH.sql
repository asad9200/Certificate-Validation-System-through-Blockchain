-- =====================================================
-- 🕵️ CHECK IF YOU ARE ON THE WRONG PROJECT
-- =====================================================

-- 1. List ALL 5 most recent users in this database
SELECT 
    id, 
    email, 
    created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verify if your specific ID exists here
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = '444b972c-abe4-43ac-88ae-88a40943da04') 
        THEN '✅ FOUND IT! This is the right database.'
        ELSE '❌ NOT FOUND! You are likely on the WRONG project.'
    END as status;

-- =====================================================
-- YOUR APP IS CONNECTED TO PROJECT: axfbwkwhexjxmbszqeza
-- PLEASE CHECK YOUR BROWSER URL IN SUPABASE DASHBOARD!
-- It should look like: https://supabase.com/dashboard/project/axfbwkwhexjxmbszqeza
-- =====================================================
