-- Verificar estado de usuarios en auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO'
        ELSE 'NO CONFIRMADO'
    END as estado_email
FROM auth.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- Verificar usuarios en tabla public.users
SELECT 
    'PUBLIC USERS' as tabla,
    id,
    email,
    nombre,
    rol,
    created_at
FROM public.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- Verificar relación user_obras
SELECT 
    'USER OBRAS' as tabla,
    uo.id,
    u.email,
    uo.obra_id,
    uo.rol_obra,
    uo.assigned_at
FROM public.user_obras uo
JOIN public.users u ON uo.user_id = u.id
WHERE u.email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY u.email;