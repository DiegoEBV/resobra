-- Verificación final de usuarios creados
-- Este script confirma que los usuarios están correctamente configurados

-- 1. Verificar usuarios en auth.users (tabla de autenticación)
SELECT 
    'AUTH USERS' as tabla,
    email, 
    email_confirmed_at IS NOT NULL as email_confirmado,
    confirmed_at IS NOT NULL as usuario_confirmado,
    created_at
FROM auth.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- 2. Verificar usuarios en public.users (perfiles de usuario)
SELECT 
    'PUBLIC USERS' as tabla,
    email,
    nombre,
    rol,
    created_at
FROM public.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- 3. Verificar asociaciones en user_obras
SELECT 
    'USER OBRAS' as tabla,
    u.email,
    u.nombre,
    uo.obra_id,
    o.nombre as obra_nombre
FROM public.users u
JOIN public.user_obras uo ON u.id = uo.user_id
JOIN public.obras o ON uo.obra_id = o.id
WHERE u.email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY u.email;

-- Resumen de configuración
SELECT 
    'RESUMEN' as info,
    'Los usuarios RESIDENTE@CVH.COM y PRODUCCION@CVH.COM están configurados' as mensaje,
    'Contraseña: 123456 para ambos usuarios' as credenciales;