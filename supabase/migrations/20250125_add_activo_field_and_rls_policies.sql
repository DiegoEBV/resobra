-- Migración para agregar campo 'activo' a la tabla users y configurar políticas RLS
-- Fecha: 2025-01-25

-- 1. Agregar campo 'activo' a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- 2. Actualizar usuarios existentes para que estén activos por defecto
UPDATE users 
SET activo = true 
WHERE activo IS NULL;

-- 3. Crear índice para mejorar rendimiento en consultas por estado activo
CREATE INDEX IF NOT EXISTS idx_users_activo ON users(activo);

-- 4. Verificar que RLS esté habilitado en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si existen para evitar conflictos
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

-- 6. Crear políticas RLS para la tabla users

-- Política de SELECT: Los usuarios pueden ver todos los usuarios
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (true);

-- Política de INSERT: Solo usuarios autenticados pueden crear usuarios
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política de UPDATE: Solo usuarios autenticados pueden actualizar usuarios
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política de DELETE: Solo usuarios autenticados pueden eliminar usuarios
CREATE POLICY "users_delete_policy" ON users
    FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- 7. Otorgar permisos necesarios a los roles anon y authenticated
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- 8. Verificar la estructura final de la tabla
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar que las políticas RLS se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' 
AND schemaname = 'public';

-- 10. Verificar permisos otorgados
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;