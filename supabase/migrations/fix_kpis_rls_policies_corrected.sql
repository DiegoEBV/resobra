-- Corregir políticas RLS para la tabla kpis
-- Fecha: 2025-01-19
-- Descripción: Crear políticas RLS correctas usando la tabla user_obras

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;

-- Habilitar RLS en la tabla kpis
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Los usuarios pueden ver KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_select_policy" ON kpis
    FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            -- El usuario tiene acceso a la obra
            EXISTS (
                SELECT 1 FROM user_obras uo
                WHERE uo.user_id = auth.uid()
                AND uo.obra_id = kpis.obra_id
            )
            OR
            -- O es el creador del KPI
            created_by = auth.uid()
        )
    );

-- Política INSERT: Los usuarios autenticados pueden crear KPIs para obras a las que tienen acceso
CREATE POLICY "kpis_insert_policy" ON kpis
    FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        -- El usuario tiene acceso a la obra
        EXISTS (
            SELECT 1 FROM user_obras uo
            WHERE uo.user_id = auth.uid()
            AND uo.obra_id = kpis.obra_id
        )
    );

-- Política UPDATE: Los usuarios pueden actualizar KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_update_policy" ON kpis
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL AND (
            -- El usuario tiene acceso a la obra
            EXISTS (
                SELECT 1 FROM user_obras uo
                WHERE uo.user_id = auth.uid()
                AND uo.obra_id = kpis.obra_id
            )
            OR
            -- O es el creador del KPI
            created_by = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        -- El usuario tiene acceso a la obra (para el nuevo valor)
        EXISTS (
            SELECT 1 FROM user_obras uo
            WHERE uo.user_id = auth.uid()
            AND uo.obra_id = kpis.obra_id
        )
    );

-- Política DELETE: Los usuarios pueden eliminar KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_delete_policy" ON kpis
    FOR DELETE
    USING (
        auth.uid() IS NOT NULL AND (
            -- El usuario tiene acceso a la obra
            EXISTS (
                SELECT 1 FROM user_obras uo
                WHERE uo.user_id = auth.uid()
                AND uo.obra_id = kpis.obra_id
            )
            OR
            -- O es el creador del KPI
            created_by = auth.uid()
        )
    );

-- Otorgar permisos a los roles
GRANT SELECT, INSERT, UPDATE, DELETE ON kpis TO authenticated;
GRANT SELECT ON kpis TO anon;

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'kpis'
ORDER BY policyname