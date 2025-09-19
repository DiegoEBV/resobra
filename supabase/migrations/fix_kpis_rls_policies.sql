-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;

-- Crear políticas RLS para la tabla kpis
-- Política para SELECT: usuarios autenticados pueden ver KPIs de obras donde están asignados
CREATE POLICY "kpis_select_policy" ON kpis
    FOR SELECT
    TO authenticated
    USING (
        obra_id IN (
            SELECT o.id 
            FROM obras o 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
        OR 
        actividad_id IN (
            SELECT a.id 
            FROM actividades a 
            JOIN obras o ON a.obra_id = o.id 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
    );

-- Política para INSERT: usuarios autenticados pueden crear KPIs en obras donde están asignados
CREATE POLICY "kpis_insert_policy" ON kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (
        obra_id IN (
            SELECT o.id 
            FROM obras o 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
        OR 
        actividad_id IN (
            SELECT a.id 
            FROM actividades a 
            JOIN obras o ON a.obra_id = o.id 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
    );

-- Política para UPDATE: usuarios autenticados pueden actualizar KPIs que crearon o en obras donde están asignados
CREATE POLICY "kpis_update_policy" ON kpis
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR 
        obra_id IN (
            SELECT o.id 
            FROM obras o 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
        OR 
        actividad_id IN (
            SELECT a.id 
            FROM actividades a 
            JOIN obras o ON a.obra_id = o.id 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
    )
    WITH CHECK (
        obra_id IN (
            SELECT o.id 
            FROM obras o 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
        OR 
        actividad_id IN (
            SELECT a.id 
            FROM actividades a 
            JOIN obras o ON a.obra_id = o.id 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
    );

-- Política para DELETE: usuarios autenticados pueden eliminar KPIs que crearon o en obras donde están asignados
CREATE POLICY "kpis_delete_policy" ON kpis
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR 
        obra_id IN (
            SELECT o.id 
            FROM obras o 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
        OR 
        actividad_id IN (
            SELECT a.id 
            FROM actividades a 
            JOIN obras o ON a.obra_id = o.id 
            JOIN obra_usuarios ou ON o.id = ou.obra_id 
            WHERE ou.user_id = auth.uid()
        )
    );

-- Asegurar que RLS esté habilitado
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Otorgar permisos básicos a los roles
GRANT SELECT, INSERT, UPDATE, DELETE ON kpis TO authenticated;
GRANT SELECT ON kpis TO anon;

-- Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'kpis'
ORDER BY policyname;