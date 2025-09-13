-- Script para corregir las asignaciones de obras al usuario

-- 1. Obtener el usuario más reciente (probablemente el que está logueado)
DO $$
DECLARE
    current_user_id UUID;
    obra_id_1 UUID;
    obra_id_2 UUID;
BEGIN
    -- Obtener el usuario más reciente
    SELECT id INTO current_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Usuario actual: %', current_user_id;
    
    -- Obtener las obras disponibles
    SELECT id INTO obra_id_1 FROM obras ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO obra_id_2 FROM obras ORDER BY created_at DESC LIMIT 1 OFFSET 1;
    
    RAISE NOTICE 'Obra 1: %', obra_id_1;
    RAISE NOTICE 'Obra 2: %', obra_id_2;
    
    -- Verificar si ya tiene asignaciones
    IF NOT EXISTS (SELECT 1 FROM user_obras WHERE user_id = current_user_id) THEN
        RAISE NOTICE 'Usuario no tiene obras asignadas, creando asignaciones...';
        
        -- Asignar la primera obra si existe
        IF obra_id_1 IS NOT NULL THEN
            INSERT INTO user_obras (user_id, obra_id, rol_obra)
            VALUES (current_user_id, obra_id_1, 'residente')
            ON CONFLICT DO NOTHING;
            RAISE NOTICE 'Asignada obra 1: %', obra_id_1;
        END IF;
        
        -- Asignar la segunda obra si existe y es diferente
        IF obra_id_2 IS NOT NULL AND obra_id_2 != obra_id_1 THEN
            INSERT INTO user_obras (user_id, obra_id, rol_obra)
            VALUES (current_user_id, obra_id_2, 'logistica')
            ON CONFLICT DO NOTHING;
            RAISE NOTICE 'Asignada obra 2: %', obra_id_2;
        END IF;
    ELSE
        RAISE NOTICE 'Usuario ya tiene obras asignadas';
    END IF;
END $$;

-- 2. Verificar las asignaciones creadas
SELECT 
    uo.id,
    uo.user_id,
    uo.obra_id,
    u.email as user_email,
    o.nombre as obra_nombre,
    uo.rol_obra
FROM user_obras uo
JOIN auth.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at DESC;

-- 3. Verificar permisos para anon y authenticated
GRANT SELECT ON user_obras TO anon;
GRANT SELECT ON user_obras TO authenticated;
GRANT ALL ON user_obras TO authenticated;

-- 4. Mostrar resultado final
SELECT 'Asignaciones completadas' as status;