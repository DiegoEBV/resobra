-- Verificar el límite actual del campo nombre en la tabla obras
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'obras' 
    AND column_name = 'nombre';

-- También verificar si hay datos existentes y su longitud máxima
SELECT 
    MAX(LENGTH(nombre)) as max_current_length,
    COUNT(*) as total_obras
FROM public.obras;