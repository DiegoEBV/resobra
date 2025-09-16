-- Corregir las funciones para usar la estructura correcta de user_obras
-- La tabla user_obras tiene: id, user_id, obra_id, rol_obra, assigned_at

-- Función corregida para asignar automáticamente obras a todos los usuarios existentes
CREATE OR REPLACE FUNCTION auto_assign_obra_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar registros en user_obras para cada usuario existente
  INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
  SELECT 
    au.id as user_id,
    NEW.id as obra_id,
    CASE 
      WHEN au.email = 'residente@cvh.com' THEN 'residente'
      WHEN au.email = 'produccion@cvh.com' THEN 'logistica'
      ELSE 'residente'
    END as rol_obra,
    NOW() as assigned_at
  FROM auth.users au
  WHERE au.email_confirmed_at IS NOT NULL; -- Solo usuarios confirmados
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función manual corregida para asignar obras existentes a un usuario específico
CREATE OR REPLACE FUNCTION assign_existing_obras_to_user(user_email TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_uuid UUID;
  assigned_count INTEGER := 0;
  user_role TEXT;
BEGIN
  -- Obtener el UUID del usuario por email
  SELECT id INTO user_uuid 
  FROM auth.users 
  WHERE email = user_email AND email_confirmed_at IS NOT NULL;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado o no confirmado: %', user_email;
  END IF;
  
  -- Determinar el rol basado en el email
  user_role := CASE 
    WHEN user_email = 'residente@cvh.com' THEN 'residente'
    WHEN user_email = 'produccion@cvh.com' THEN 'logistica'
    ELSE 'residente'
  END;
  
  -- Insertar asignaciones para todas las obras que no estén ya asignadas a este usuario
  INSERT INTO user_obras (user_id, obra_id, rol_obra, assigned_at)
  SELECT 
    user_uuid,
    o.id,
    user_role,
    NOW()
  FROM obras o
  WHERE NOT EXISTS (
    SELECT 1 FROM user_obras uo 
    WHERE uo.user_id = user_uuid AND uo.obra_id = o.id
  );
  
  GET DIAGNOSTICS assigned_count = ROW_COUNT;
  
  RETURN assigned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función corregida para asignar todas las obras existentes a todos los usuarios
CREATE OR REPLACE FUNCTION assign_all_existing_obras_to_all_users()
RETURNS TABLE(user_email TEXT, assigned_count INTEGER) AS $$
DECLARE
  user_record RECORD;
  count_assigned INTEGER;
BEGIN
  -- Iterar sobre todos los usuarios confirmados
  FOR user_record IN 
    SELECT email FROM auth.users WHERE email_confirmed_at IS NOT NULL
  LOOP
    -- Asignar obras existentes a cada usuario
    SELECT assign_existing_obras_to_user(user_record.email) INTO count_assigned;
    
    -- Retornar resultado
    user_email := user_record.email;
    assigned_count := count_assigned;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos necesarios
GRANT EXECUTE ON FUNCTION auto_assign_obra_to_users() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_existing_obras_to_user(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_all_existing_obras_to_all_users() TO authenticated;