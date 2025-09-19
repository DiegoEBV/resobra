-- Corrección simple de permisos para la tabla users
-- Fecha: 2025-01-20

-- 1. Eliminar todas las políticas existentes de users
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_insert_all" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;
DROP POLICY IF EXISTS "users_delete_all" ON users;

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 3. Otorgar permisos directos a los roles
GRANT ALL PRIVILEGES ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO service_role;

-- 4. Crear políticas permisivas
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

-- 5. Prueba de inserción
INSERT INTO users (email, nombre, rol) 
VALUES ('test_permissions_' || extract(epoch from now()) || '@example.com', 'Test User', 'residente')
ON CONFLICT (email) DO NOTHING;

-- 6. Limpiar usuario de prueba
DELETE FROM users WHERE email LIKE 'test_permissions_%@example.com';

-- Mensaje de confirmación
SELECT 'Permisos de tabla users corregidos exitosamente' as status;