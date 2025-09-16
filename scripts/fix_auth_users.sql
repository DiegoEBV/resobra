-- Script para verificar y corregir usuarios en auth.users
-- Verificar usuarios existentes
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
FROM auth.users 
WHERE email IN ('residente@cvh.com', 'produccion@cvh.com')
ORDER BY email;

-- Actualizar email_confirmed_at para usuarios existentes
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email IN ('residente@cvh.com', 'produccion@cvh.com')
  AND email_confirmed_at IS NULL;

-- Verificar la actualización
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email IN ('residente@cvh.com', 'produccion@cvh.com')
ORDER BY email;

-- Si no existen usuarios, crearlos directamente en auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
)
SELECT 
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000'::uuid,
    email,
    crypt('123456', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    'authenticated',
    'authenticated'
FROM (
    VALUES 
        ('residente@cvh.com'),
        ('produccion@cvh.com')
) AS new_users(email)
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE auth.users.email = new_users.email
);

-- Verificar resultado final
SELECT 
    'FINAL VERIFICATION' as status,
    id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    confirmed_at IS NOT NULL as confirmed,
    created_at,
    raw_app_meta_data
FROM auth.users 
WHERE email IN ('residente@cvh.com', 'produccion@cvh.com')
ORDER BY email;