-- Verificar usuarios creados y confirmados
SELECT 
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'CONFIRMADO'
        ELSE 'NO CONFIRMADO'
    END as estado_confirmacion
FROM auth.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- Verificar usuarios en tabla public.users
SELECT 
    id,
    email,
    nombre,
    rol,
    created_at
FROM public.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY email;

-- Verificar relación con obras
SELECT 
    uo.user_id,
    u.email,
    u.nombre,
    uo.obra_id,
    o.nombre as obra_nombre
FROM public.user_obras uo
JOIN public.users u ON uo.user_id = u.id
LEFT JOIN public.obras o ON uo.obra_id = o.id
WHERE u.email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM')
ORDER BY u.email;