-- Migración para establecer explícitamente el límite de 1000 caracteres en el campo nombre
-- Esta migración corrige el problema donde el límite no se aplicó correctamente

-- Primero verificamos el tipo actual
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'obras' 
    AND column_name = 'nombre';

-- Modificar explícitamente el campo nombre para que tenga exactamente 1000 caracteres
ALTER TABLE public.obras 
ALTER COLUMN nombre TYPE VARCHAR(1000);

-- Verificar que el cambio se aplicó correctamente
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'obras' 
    AND column_name = 'nombre';

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN public.obras.nombre IS 'Nombre de la obra - máximo 1000 caracteres (VARCHAR(1000))';