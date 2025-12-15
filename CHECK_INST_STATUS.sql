-- CHECK INSTITUTION STATUS
SELECT 
    i.name,
    i.status,
    i.is_active,
    up.full_name,
    up.role
FROM institutions i
JOIN user_profiles up ON up.institution_id = i.id
WHERE up.id = '444b972c-abe4-43ac-88ae-88a40943da04';
