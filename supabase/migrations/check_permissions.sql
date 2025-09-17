-- Verificar permisos actuales para las tablas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Otorgar permisos básicos a las tablas principales si no existen
GRANT SELECT ON actividades TO anon;
GRANT SELECT ON actividades TO authenticated;
GRANT ALL PRIVILEGES ON actividades TO authenticated;

GRANT SELECT ON obras TO anon;
GRANT SELECT ON obras TO authenticated;
GRANT ALL PRIVILEGES ON obras TO authenticated;

GRANT SELECT ON projects TO anon;
GRANT SELECT ON projects TO authenticated;
GRANT ALL PRIVILEGES ON projects TO authenticated;

GRANT SELECT ON items TO anon;
GRANT SELECT ON items TO authenticated;
GRANT ALL PRIVILEGES ON items TO authenticated;

GRANT SELECT ON reports TO anon;
GRANT SELECT ON reports TO authenticated;
GRANT ALL PRIVILEGES ON reports TO authenticated;

GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;