-- Script para diagnosticar el problema de obras no asignadas al usuario

-- 1. Verificar usuarios existentes en auth.users
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verificar obras disponibles
SELECT 
    id,
    nombre,
    descripcion,
    estado,
    created_at
FROM obras 
ORDER BY created_at DESC;

-- 3. Verificar asignaciones en user_obras
SELECT 
    uo.id,
    uo.user_id,
    uo.obra_id,
    u.email as user_email,
    o.nombre as obra_nombre
FROM user_obras uo
JOIN auth.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id;

-- 4. Verificar permisos en user_obras
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'user_obras'
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 5. Verificar políticas RLS en user_obras
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_obras';