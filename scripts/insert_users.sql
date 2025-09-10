-- Script para insertar usuarios predefinidos en Supabase

-- Primero, verificar si los usuarios ya existen
DO $$
DECLARE
  residente_id UUID;
  produccion_id UUID;
  obra_id UUID;
  obra_count INTEGER;
BEGIN
  -- Verificar si los usuarios ya existen
  SELECT id INTO residente_id FROM auth.users WHERE email = 'RESIDENTE@CVH.COM';
  SELECT id INTO produccion_id FROM auth.users WHERE email = 'PRODUCCION@CVH.COM';
  
  -- Si no existen, insertar en la tabla users
  IF residente_id IS NULL THEN
    -- Insertar usuario residente en la tabla users
    INSERT INTO public.users (id, email, nombre, rol, created_at, updated_at)
    VALUES (gen_random_uuid(), 'RESIDENTE@CVH.COM', 'Residente', 'residente', NOW(), NOW())
    RETURNING id INTO residente_id;
  END IF;
  
  IF produccion_id IS NULL THEN
    -- Insertar usuario producción en la tabla users
    INSERT INTO public.users (id, email, nombre, rol, created_at, updated_at)
    VALUES (gen_random_uuid(), 'PRODUCCION@CVH.COM', 'Producción', 'logistica', NOW(), NOW())
    RETURNING id INTO produccion_id;
  END IF;
  
  -- Verificar si hay obras existentes
  SELECT COUNT(*) INTO obra_count FROM public.obras;
  
  -- Si no hay obras, crear una obra de ejemplo
  IF obra_count = 0 THEN
    INSERT INTO public.obras (nombre, descripcion, ubicacion, fecha_inicio, estado)
    VALUES ('Obra de Ejemplo', 'Obra creada automáticamente para pruebas', 'Lima, Perú', CURRENT_DATE, 'activa')
    RETURNING id INTO obra_id;
  ELSE
    -- Obtener el ID de la primera obra
    SELECT id INTO obra_id FROM public.obras LIMIT 1;
  END IF;
  
  -- Asignar usuarios a la obra
  -- Para el usuario residente
  IF NOT EXISTS (SELECT 1 FROM public.user_obras WHERE user_id = residente_id AND obra_id = obra_id) THEN
    INSERT INTO public.user_obras (user_id, obra_id, rol_obra)
    VALUES (residente_id, obra_id, 'residente');
  END IF;
  
  -- Para el usuario producción
  IF NOT EXISTS (SELECT 1 FROM public.user_obras WHERE user_id = produccion_id AND obra_id = obra_id) THEN
    INSERT INTO public.user_obras (user_id, obra_id, rol_obra)
    VALUES (produccion_id, obra_id, 'logistica');
  END IF;
  
  -- Mostrar mensaje de éxito
  RAISE NOTICE 'Usuarios y asignaciones creados correctamente';
END;
$$;