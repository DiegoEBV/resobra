-- Enfoque definitivo para resolver el error 42501 en tabla kpis
-- Paso 1: Deshabilitar temporalmente RLS
ALTER TABLE kpis DISABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;
DROP POLICY IF EXISTS "allow_all_authenticated" ON kpis;
DROP POLICY IF EXISTS "kpis_policy" ON kpis;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON kpis;
DROP POLICY IF EXISTS "Enable read access for all users" ON kpis;
DROP POLICY IF EXISTS "Enable update for users based on email" ON kpis;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON kpis;

-- Paso 3: Habilitar RLS nuevamente
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Paso 4: Crear UNA SOLA política simple que permita TODO a usuarios autenticados
CREATE POLICY "allow_all_authenticated" ON kpis
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar que la política se creó correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'kpis';

-- Verificar permisos de la tabla
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'kpis' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;