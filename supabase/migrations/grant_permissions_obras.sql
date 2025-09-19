-- Otorgar permisos para la tabla obras
GRANT SELECT ON public.obras TO anon;
GRANT ALL PRIVILEGES ON public.obras TO authenticated;

-- Otorgar permisos para la tabla user_obras
GRANT SELECT ON public.user_obras TO anon;
GRANT ALL PRIVILEGES ON public.user_obras TO authenticated;

-- Verificar que los permisos se otorgaron correctamente
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('obras', 'user_obras')
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;