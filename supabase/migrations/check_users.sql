-- Consultar usuarios existentes
SELECT id, email, nombre, rol, created_at 
FROM users 
ORDER BY created_at;

-- Consultar usuarios de auth.users (tabla de autenticación de Supabase)
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at;

-- Verificar si hay usuarios con sesiones activas
SELECT u.email, u.nombre, u.rol, au.last_sign_in_at
FROM users u
JOIN auth.users au ON u.id = au.id
ORDER BY au.last_sign_in_at DESC NULLS LAST;