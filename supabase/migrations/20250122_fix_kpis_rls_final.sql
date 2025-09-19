-- Eliminar todas las políticas RLS existentes de la tabla kpis
DROP POLICY IF EXISTS "allow_all_authenticated" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "Users can insert their own KPIs" ON kpis;
DROP POLICY IF EXISTS "Users can update their own KPIs" ON kpis;
DROP POLICY IF EXISTS "Users can delete their own KPIs" ON kpis;
DROP POLICY IF EXISTS "Users can view KPIs for their obras" ON kpis;

-- Crear una política simple que permita todas las operaciones para usuarios autenticados
CREATE POLICY "allow_all_kpis_operations" ON kpis
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar que RLS esté habilitado
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Otorgar permisos básicos a los roles
GRANT ALL ON kpis TO authenticated;
GRANT SELECT ON kpis TO anon;