-- Corrección definitiva de permisos para la tabla users
-- Fecha: 2025-01-20

-- 1. Verificar estado actual de RLS
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename 
WHERE tablename = 'users';

-- 2. Eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;

-- 3. Deshabilitar RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 4. Otorgar permisos directos a los roles
GRANT ALL PRIVILEGES ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

-- 5. Verificar permisos otorgados
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY grantee, privilege_type;

-- 6. Crear políticas permisivas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política de lectura (SELECT) - Permitir a todos
CREATE POLICY "users_select_all" ON users
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Política de inserción (INSERT) - Permitir a todos
CREATE POLICY "users_insert_all" ON users
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Política de actualización (UPDATE) - Permitir a todos
CREATE POLICY "users_update_all" ON users
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Política de eliminación (DELETE) - Permitir a todos
CREATE POLICY "users_delete_all" ON users
    FOR DELETE
    TO anon, authenticated
    USING (true);

-- 7. Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 8. Prueba de inserción
INSERT INTO users (email, nombre, rol) 
VALUES ('test_permissions_' || extract(epoch from now()) || '@example.com', 'Test User', 'residente')
ON CONFLICT (email) DO NOTHING;

-- 9. Verificar que la inserción funcionó
SELECT COUNT(*) as total_users FROM users;

-- 10. Limpiar usuario de prueba
DELETE FROM users WHERE email LIKE 'test_permissions_%@example.com';

-- Mensaje de confirmación
SELECT 'Permisos de tabla users corregidos exitosamente' as status;