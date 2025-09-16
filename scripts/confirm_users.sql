-- Script para confirmar emails de usuarios predefinidos
-- Esto resuelve el error "Email not confirmed" en Supabase Auth

-- Confirmar email del usuario RESIDENTE@CVH.COM
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'RESIDENTE@CVH.COM';

-- Confirmar email del usuario PRODUCCION@CVH.COM
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'PRODUCCION@CVH.COM';

-- Verificar que los usuarios están confirmados
SELECT 
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email IN ('RESIDENTE@CVH.COM', 'PRODUCCION@CVH.COM');

-- Mensaje de confirmación
SELECT 'Usuarios confirmados correctamente. Ahora pueden hacer login sin problemas.' as mensaje;