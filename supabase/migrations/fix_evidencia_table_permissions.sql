-- Migración para corregir permisos de la tabla evidencia_fotografica
-- Fecha: 2025-01-15
-- Descripción: Soluciona errores de permisos en la tabla evidencia_fotografica

-- Otorgar permisos básicos a roles
GRANT ALL PRIVILEGES ON evidencia_fotografica TO authenticated;
GRANT SELECT ON evidencia_fotografica TO anon;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Usuarios autenticados pueden insertar evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar evidencias" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Authenticated users can insert evidencia" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Authenticated users can view evidencia" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Authenticated users can update evidencia" ON evidencia_fotografica;
DROP POLICY IF EXISTS "Authenticated users can delete evidencia" ON evidencia_fotografica;

-- Política PERMISIVA para INSERT (más permisiva)
CREATE POLICY "Allow authenticated insert evidencia"
ON evidencia_fotografica FOR INSERT
TO authenticated
WITH CHECK (true); -- Permitir a todos los usuarios autenticados

-- Política PERMISIVA para SELECT
CREATE POLICY "Allow authenticated select evidencia"
ON evidencia_fotografica FOR SELECT
TO authenticated
USING (true); -- Permitir a todos los usuarios autenticados

-- Política PERMISIVA para UPDATE
CREATE POLICY "Allow authenticated update evidencia"
ON evidencia_fotografica FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); -- Permitir a todos los usuarios autenticados

-- Política PERMISIVA para DELETE
CREATE POLICY "Allow authenticated delete evidencia"
ON evidencia_fotografica FOR DELETE
TO authenticated
USING (true); -- Permitir a todos los usuarios autenticados

-- Verificar que RLS esté habilitado
ALTER TABLE evidencia_fotografica ENABLE ROW LEVEL SECURITY;

-- Comentarios informativos
COMMENT ON POLICY "Allow authenticated insert evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados insertar evidencias (política permisiva)';
COMMENT ON POLICY "Allow authenticated select evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados ver evidencias (política permisiva)';
COMMENT ON POLICY "Allow authenticated update evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados actualizar evidencias (política permisiva)';
COMMENT ON POLICY "Allow authenticated delete evidencia" ON evidencia_fotografica IS 'Permite a usuarios autenticados eliminar evidencias (política permisiva)';

-- Log de aplicación
SELECT 'Políticas RLS permisivas aplicadas exitosamente en evidencia_fotografica' as resultado;