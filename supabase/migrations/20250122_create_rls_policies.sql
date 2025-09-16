-- Crear políticas de RLS para permitir acceso a las tablas

-- Políticas para la tabla obras
CREATE POLICY "Allow public read access on obras" ON obras
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access on obras" ON obras
  FOR ALL USING (true);

-- Políticas para la tabla frentes
CREATE POLICY "Allow public read access on frentes" ON frentes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access on frentes" ON frentes
  FOR ALL USING (true);

-- Políticas para la tabla actividades
CREATE POLICY "Allow public read access on actividades" ON actividades
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access on actividades" ON actividades
  FOR ALL USING (true);

-- Verificar que las políticas se crearon
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('obras', 'frentes', 'actividades');