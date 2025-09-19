-- Crear políticas RLS para la tabla user_obras
-- Fecha: 2025-01-15

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own obra assignments" ON user_obras;
DROP POLICY IF EXISTS "Users can manage their own obra assignments" ON user_obras;
DROP POLICY IF EXISTS "Allow public read access to user_obras" ON user_obras;

-- Crear política para permitir lectura pública (para usuarios no autenticados)
CREATE POLICY "Allow public read access to user_obras" ON user_obras
    FOR SELECT
    TO public
    USING (true);

-- Crear política para usuarios autenticados puedan ver todas las asignaciones
CREATE POLICY "Authenticated users can view all obra assignments" ON user_obras
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política para usuarios autenticados puedan insertar/actualizar/eliminar
CREATE POLICY "Authenticated users can manage obra assignments" ON user_obras
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_obras';