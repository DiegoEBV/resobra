-- Verificar permisos actuales para la tabla users
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' AND table_name = 'users' 
-- AND grantee IN ('anon', 'authenticated') 
-- ORDER BY table_name, grantee;

-- Otorgar permisos básicos a la tabla users
-- Para usuarios anónimos (solo lectura limitada si es necesario)
GRANT SELECT ON users TO anon;

-- Para usuarios autenticados (acceso completo)
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Crear política RLS para que los usuarios solo puedan ver/editar su propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política para permitir inserción durante el registro
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Comentario sobre las políticas
-- Estas políticas aseguran que:
-- 1. Los usuarios solo pueden ver su propio perfil
-- 2. Los usuarios solo pueden actualizar su propio perfil
-- 3. Solo usuarios autenticados pueden insertar nuevos perfiles
-- 4. El ID del perfil debe