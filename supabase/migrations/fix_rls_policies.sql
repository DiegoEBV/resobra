-- Migración para corregir políticas RLS que causan errores 400 Bad Request
-- Fecha: 2024-01-17
-- Descripción: Crear políticas RLS más permisivas para actividades, user_obras y obras

-- Eliminar políticas existentes que puedan estar causando conflictos
DROP POLICY IF EXISTS "Users can view their assigned obras" ON obras;
DROP POLICY IF EXISTS "Users can view their obra assignments" ON user_obras;
DROP POLICY IF EXISTS "Users can view activities from their obras" ON actividades;
DROP POLICY IF EXISTS "Users can view all activities" ON actividades;
DROP POLICY IF EXISTS "Authenticated users can view activities" ON actividades;

-- Política para obras: permitir que usuarios autenticados vean todas las obras
CREATE POLICY "Authenticated users can view all obras"
  ON obras FOR SELECT
  TO authenticated
  USING (true);

-- Política para user_obras: permitir que usuarios vean sus asignaciones
CREATE POLICY "Users can view their obra assignments"
  ON user_obras FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política para actividades: permitir que usuarios autenticados vean todas las actividades
CREATE POLICY "Authenticated users can view all actividades"
  ON actividades FOR SELECT
  TO authenticated
  USING (true);

-- Política adicional para actividades: permitir operaciones de inserción y actualización
CREATE POLICY "Authenticated users can insert actividades"
  ON actividades FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their actividades"
  ON actividades FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política para frentes: permitir que usuarios autenticados vean todos los frentes
CREATE POLICY "Authenticated users can view all frentes"
  ON frentes FOR SELECT
  TO authenticated
  USING (true);

-- Política para evidencias: permitir que usuarios vean evidencias de sus actividades
CREATE POLICY "Users can view evidencias from their activities"
  ON evidencias FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actividades 
      WHERE actividades.id = evidencias.actividad_id 
      AND actividades.user_id = auth.uid()
    )
  );

-- Política para recursos: permitir que usuarios vean recursos de sus actividades
CREATE POLICY "Users can view recursos from their activities"
  ON recursos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM actividades 
      WHERE actividades.id = recursos.actividad_id 
      AND actividades.user_id = auth.uid()
    )
  );

-- Verificar que RLS esté habilitado en todas las tablas
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE frentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;

-- Comentario de finalización
-- Esta migración debería resolver los errores 400 Bad Request
-- al permitir consultas más amplias para usuarios autenticados