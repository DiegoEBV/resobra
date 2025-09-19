-- Migración para corregir las políticas RLS de la tabla evaluaciones
-- Fecha: 2025-01-22

-- Eliminar políticas existentes que son muy restrictivas
DROP POLICY IF EXISTS "Users can view evaluaciones of their obras" ON evaluaciones;
DROP POLICY IF EXISTS "Residents can create evaluaciones" ON evaluaciones;

-- Crear nuevas políticas más flexibles para evaluaciones

-- Política para SELECT: Los usuarios pueden ver evaluaciones de sus obras
CREATE POLICY "authenticated_users_can_view_evaluaciones" ON evaluaciones
    FOR SELECT 
    TO authenticated
    USING (
        obra_id IN (
            SELECT obra_id 
            FROM user_obras 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Política para INSERT: Los usuarios autenticados pueden crear evaluaciones en sus obras
CREATE POLICY "authenticated_users_can_create_evaluaciones" ON evaluaciones
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        evaluador_id::text = auth.uid()::text AND
        obra_id IN (
            SELECT obra_id 
            FROM user_obras 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Política para UPDATE: Los usuarios pueden actualizar evaluaciones que crearon
CREATE POLICY "authenticated_users_can_update_own_evaluaciones" ON evaluaciones
    FOR UPDATE 
    TO authenticated
    USING (
        evaluador_id::text = auth.uid()::text AND
        obra_id IN (
            SELECT obra_id 
            FROM user_obras 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Política para DELETE: Los usuarios pueden eliminar evaluaciones que crearon
CREATE POLICY "authenticated_users_can_delete_own_evaluaciones" ON evaluaciones
    FOR DELETE 
    TO authenticated
    USING (
        evaluador_id::text = auth.uid()::text AND
        obra_id IN (
            SELECT obra_id 
            FROM user_obras 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Verificar que RLS esté habilitado
ALTER TABLE evaluaciones ENABLE ROW LEVEL SECURITY;

-- Verificar permisos de tabla para roles
GRANT SELECT, INSERT, UPDATE, DELETE ON evaluaciones TO authenticated;
GRANT SELECT ON evaluaciones TO anon;

-- Verificar las nuevas políticas creadas
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
WHERE tablename = 'evaluaciones'
ORDER BY policyname;