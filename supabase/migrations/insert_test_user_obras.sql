-- Insertar datos de prueba en user_obras
-- Primero verificamos si hay usuarios y obras disponibles

DO $$
DECLARE
    test_user_id uuid;
    obra1_id uuid;
    obra2_id uuid;
    user_count integer;
    obra_count integer;
BEGIN
    -- Contar usuarios en auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Usuarios en auth.users: %', user_count;
    
    -- Contar obras disponibles
    SELECT COUNT(*) INTO obra_count FROM obras;
    RAISE NOTICE 'Obras disponibles: %', obra_count;
    
    IF user_count > 0 AND obra_count > 0 THEN
        -- Obtener el primer usuario de auth.users
        SELECT id INTO test_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
        RAISE NOTICE 'Usuario seleccionado: %', test_user_id;
        
        -- Obtener las primeras dos obras
        SELECT id INTO obra1_id FROM obras ORDER BY created_at DESC LIMIT 1;
        SELECT id INTO obra2_id FROM obras ORDER BY created_at DESC OFFSET 1 LIMIT 1;
        
        RAISE NOTICE 'Obra 1 seleccionada: %', obra1_id;
        RAISE NOTICE 'Obra 2 seleccionada: %', obra2_id;
        
        -- Verificar si ya existe la asignación
        IF NOT EXISTS (SELECT 1 FROM user_obras WHERE user_id = test_user_id AND obra_id = obra1_id) THEN
            INSERT INTO user_obras (user_id, obra_id, rol_obra) 
            VALUES (test_user_id, obra1_id, 'residente');
            RAISE NOTICE 'Asignación creada: usuario % -> obra % (residente)', test_user_id, obra1_id;
        ELSE
            RAISE NOTICE 'La asignación ya existe para usuario % y obra %', test_user_id, obra1_id;
        END IF;
        
        -- Insertar segunda asignación si hay segunda obra
        IF obra2_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM user_obras WHERE user_id = test_user_id AND obra_id = obra2_id) THEN
                INSERT INTO user_obras (user_id, obra_id, rol_obra) 
                VALUES (test_user_id, obra2_id, 'logistica');
                RAISE NOTICE 'Asignación creada: usuario % -> obra % (logistica)', test_user_id, obra2_id;
            ELSE
                RAISE NOTICE 'La asignación ya existe para usuario % y obra %', test_user_id, obra2_id;
            END IF;
        END IF;
        
    ELSE
        RAISE NOTICE 'No hay suficientes usuarios (%) o obras (%) para crear asignaciones', user_count, obra_count;
    END IF;
    
    -- Mostrar el estado final
    RAISE NOTICE 'Total de asignaciones user_obras: %', (SELECT COUNT(*) FROM user_obras);
END $$;

-- Verificar el resultado final
SELECT 
    uo.id,
    uo.user_id,
    uo.obra_id,
    uo.rol_obra,
    o.nombre as obra_nombre
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
ORDER BY uo.assigned_at DESC;