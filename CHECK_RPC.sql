-- CHECK IF RPC FUNCTION EXISTS
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'generate_certificate_id';
