-- Migración para corregir políticas RLS de evidencia_fotografica
-- Fecha: 2024-01-15
-- Descripción: Establece políticas RLS correctas para permitir operaciones CRUD en evidencia_fotografica

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view evidencia_fotografica" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can insert evidencia_fotografica" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can update evidencia_fotografica" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Users can delete evidencia_fotografica" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Authenticated users can manage evidencia_fotografica" ON evidencia_fotografica;

-- Crear políticas RLS para evidencia_fotografica
-- Política para SELECT: Los usuarios autenticados pueden ver todas las evidencias
CREATE POLICY "Authenticated users can view evidencia_fotografica" ON evidencia_fotografica
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para INSERT: Los usuarios autenticados pueden insertar evidencias
CREATE POLICY "Authenticated users can insert evidencia_fotografica" ON evidencia_fotografica
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE: Los usuarios autenticados pueden actualizar evidencias que subieron
CREATE POLICY "Authenticated users can update own evidencia_fotografica" ON evidencia_fotografica
    FOR UPDATE
    TO authenticated
    USING (subido_por = auth.uid())
    WITH CHECK (subido_por = auth.uid());

-- Política para DELETE: Los usuarios autenticados pueden eliminar evidencias que subieron
CREATE POLICY "Authenticated users can delete own evidencia_fotografica" ON evidencia_fotografica
    FOR DELETE
    TO authenticated
    USING (subido_por = auth.uid());

-- Otorgar permisos básicos a los roles
GRANT SELECT, INSERT, UPDATE, DELETE ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- Verificar que RLS esté habilitado
ALTER TABLE evidencia_fotografica ENABLE ROW LEVEL SECURITY;

-- Comentarios para documentación
COMMENT ON POLICY "Authenticated users can view evidencia_fotografica" ON evidencia_fotografica IS 'Permite a usuarios autenticados ver todas las evidencias fotográficas';
COMMENT ON POLICY "Authenticated users can insert evidencia_fotografica" ON evidencia_fotografica IS 'Permite a usuarios autenticados insertar nuevas evidencias fotográficas';
COMMENT ON POLICY "Authenticated users can update own evidencia_fotografica" ON evidencia_fotografica IS 'Permite a usuarios autenticados actualizar sus propias evidencias fotográficas';
COMMENT ON POLICY "Authenticated users can delete own evidencia_fotografica" ON evidencia_fotografica IS 'Permite a usuarios autenticados eliminar sus propias evidencias fotográficas';