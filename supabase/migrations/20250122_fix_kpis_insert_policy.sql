-- Corregir política de inserción de KPIs
-- Fecha: 2025-01-22
-- Descripción: Solucionar error 42501 - new row violates row-level security policy

-- Verificar estado actual de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'kpis' AND schemaname = 'public';

-- Verificar políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'kpis'
ORDER BY policyname;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "kpis_select_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_insert_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_update_policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;

-- Política SELECT: Los usuarios pueden ver KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_select_policy" ON kpis
    FOR SELECT
    TO authenticated
    USING (
        -- El usuario tiene acceso a la obra
        EXISTS (
            SELECT 1 FROM user_obras uo
            WHERE uo.user_id = auth.uid()
            AND uo.obra_id = kpis.obra_id
        )
        OR
        -- O es el creador del KPI
        created_by = auth.uid()
        OR
        -- O si no hay obra_id específica, permitir acceso
        obra_id IS NULL
    );

-- Política INSERT: Los usuarios autenticados pueden crear KPIs
CREATE POLICY "kpis_insert_policy" ON kpis
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Si hay obra_id, verificar que el usuario tenga acceso
        (
            obra_id IS NULL 
            OR 
            EXISTS (
                SELECT 1 FROM user_obras uo
                WHERE uo.user_id = auth.uid()
                AND uo.obra_id = kpis.obra_id
            )
        )
        AND
        -- Asegurar que created_by se establezca correctamente
        (created_by IS NULL OR created_by = auth.uid())
    );

-- Política UPDATE: Los usuarios pueden actualizar KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_update_policy" ON kpis
    FOR UPDATE
    TO authenticated
    USING (
        -- El usuario tiene acceso a la obra
        EXISTS (
            SELECT 1 FROM user_obras uo
            WHERE uo.user_id = auth.uid()
            AND uo.obra_id = kpis.obra_id
        )
        OR
        -- O es el creador del KPI
        created_by = auth.uid()
        OR
        -- O si no hay obra_id específica
        obra_id IS NULL
    )
    WITH CHECK (
        -- Para el nuevo valor, verificar acceso
        (
            obra_id IS NULL 
            OR 
            EXISTS (
                SELECT 1 FROM user_obras uo
                WHERE uo.user_id = auth.uid()
                AND uo.obra_id = kpis.obra_id
            )
        )
    );

-- Política DELETE: Los usuarios pueden eliminar KPIs de obras a las que tienen acceso
CREATE POLICY "kpis_delete_policy" ON kpis
    FOR DELETE
    TO authenticated
    USING (
        -- El usuario tiene acceso a la obra
        EXISTS (
            SELECT 1 FROM user_obras uo
            WHERE uo.user_id = auth.uid()
            AND uo.obra_id = kpis.obra_id
        )
        OR
        -- O es el creador del KPI
        created_by = auth.uid()
        OR
        -- O si no hay obra_id específica
        obra_id IS NULL
    );

-- Asegurar que los permisos estén correctos
GRANT SELECT, INSERT, UPDATE, DELETE ON kpis TO authenticated;
GRANT SELECT ON kpis TO anon;

-- Verificar que las políticas se crearon correctamente
SELECT 
    'Políticas creadas:' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'kpis'
ORDER BY policyname;

-- Verificar datos en user_obras para debug
SELECT 
    'Registros en user_obras:' as info,
    COUNT(*) as total_registros
FROM user_obras;

-- Mostrar algunos registros de ejemplo (sin mostrar IDs reales por seguridad)
SELECT 
    'Ejemplo user_obras:' as info,
    rol_obra,
    assigned_at
FROM user_obras 
LIMIT 3;