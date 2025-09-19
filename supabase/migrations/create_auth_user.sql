-- Crear usuario de autenticación en Supabase Auth
-- Nota: Este script debe ejecutarse con privilegios de servicio

-- Insertar usuario en auth.users (tabla de autenticación de Supabase)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')), -- Encriptar la contraseña
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  updated_at = NOW();

-- Insertar identidad en auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  '{"sub":"550e8400-e29b-41d4-a716-446655440000","email":"test@example.com"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, id) DO UPDATE SET
  identity_data = EXCLUDED.identity_data,
  updated_at = NOW();

-- Verificar que el usuario fue creado
SELECT 'Usuario de autenticación creado:' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'test@example.com';

-- Verificar que el perfil existe en la tabla users
SELECT 'Perfil de usuario:' as info;
SELECT id, email, nombre FROM users WHERE email = 'test@example.com';

-- Verificar las asignaciones de obras
SELECT 'Obras asignadas:' as info;
SELECT uo.user_id, uo.obra_id, uo.rol_obra, o.nombre as obra_nombre
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
WHERE uo.user_id = '550e8400-e29b-41d4-a716-446655440000';