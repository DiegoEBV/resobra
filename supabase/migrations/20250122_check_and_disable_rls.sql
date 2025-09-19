-- Verificar y eliminar todas las políticas RLS de la tabla kpis

-- Primero, mostrar todas las políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'kpis';

-- Eliminar TODAS las políticas RLS existentes de la tabla kpis
DROP POLICY IF EXISTS "allow_all_kpis_operations" ON kpis;
DROP POLICY IF EXISTS "allow_all_authenticated" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON kpis;
DROP POLICY IF EXISTS "Enable read access for all users" ON kpis;
DROP POLICY IF EXISTS "Enable update for users based on email" ON kpis;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON kpis;

-- DESHABILITAR completamente RLS en la tabla kpis
ALTER TABLE kpis DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'kpis';

-- Mostrar que no hay políticas
SELECT COUNT(*) as politicas_restantes
FROM pg_policies 
WHERE tablename = 'kpis';

-- Otorgar permisos básicos a los roles
GRANT ALL PRIVILEGES ON kpis TO authenticated;
GRANT SELECT ON kpis TO anon;