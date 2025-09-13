-- Verificar y corregir políticas RLS para eliminación de KPIs
-- Fecha: 2025-01-22
-- Propósito: Solucionar problema de eliminación de KPIs

-- Eliminar políticas de eliminación existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can delete KPIs" ON kpis;
DROP POLICY IF EXISTS "Users can delete their KPIs" ON kpis;
DROP POLICY IF EXISTS "Delete KPIs policy" ON kpis;
DROP POLICY IF EXISTS "kpis_delete_policy" ON kpis;

-- Crear nueva política de eliminación más permisiva
CREATE POLICY "Users can delete KPIs" ON kpis
    FOR DELETE
    TO authenticated
    USING (
        -- Permitir eliminar KPIs de obras asignadas al usuario
        obra_id IN (
            SELECT uo.obra_id FROM user_obras uo
            WHERE uo.user_id = auth.uid()
        )
        OR
        -- Permitir eliminar KPIs de actividades en obras asignadas al usuario
        actividad_id IN (
            SELECT a.id FROM actividades a
            JOIN user_obras uo ON a.obra_id = uo.obra_id
            WHERE uo.user_id = auth.uid()
        )
        OR
        -- Permitir eliminar KPIs creados por el usuario
        created_by = auth.uid()
    );

-- Verificar que el rol authenticated tiene permisos DELETE
GRANT DELETE ON kpis TO authenticated;

-- Verificar las políticas después de la creación
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'kpis' 
AND cmd = 'DELETE';

-- Verificar permisos de la tabla
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'kpis' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;