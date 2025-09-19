-- Verificar y asegurar acceso del usuario a obras
-- Fecha: 2025-01-22
-- Descripción: Verificar que los usuarios tengan acceso a obras para poder crear KPIs

-- Verificar registros actuales en user_obras
SELECT 
    'Registros actuales en user_obras:' as info,
    COUNT(*) as total_registros
FROM user_obras;

-- Mostrar algunos registros de ejemplo
SELECT 
    'Ejemplos de user_obras:' as info,
    uo.rol_obra,
    uo.assigned_at,
    u.email as user_email,
    o.nombre as obra_nombre
FROM user_obras uo
JOIN auth.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
LIMIT 5;

-- Verificar si hay usuarios sin acceso a obras
SELECT 
    'Usuarios sin acceso a obras:' as info,
    COUNT(*) as usuarios_sin_acceso
FROM auth.users u
WHERE u.id NOT IN (SELECT DISTINCT user_id FROM user_obras);

-- Si no hay registros en user_obras, crear algunos de ejemplo
-- (Solo ejecutar si es necesario)
DO $$
BEGIN
    -- Verificar si hay al menos un registro en user_obras
    IF NOT EXISTS (SELECT 1 FROM user_obras LIMIT 1) THEN
        -- Crear registros de ejemplo solo si hay usuarios y obras
        IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) AND EXISTS (SELECT 1 FROM obras LIMIT 1) THEN
            -- Asignar el primer usuario a la primera obra como residente
            INSERT INTO user_obras (user_id, obra_id, rol_obra)
            SELECT 
                (SELECT id FROM auth.users ORDER BY created_at LIMIT 1),
                (SELECT id FROM obras ORDER BY created_at LIMIT 1),
                'residente'
            WHERE NOT EXISTS (
                SELECT 1 FROM user_obras 
                WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
                AND obra_id = (SELECT id FROM obras ORDER BY created_at LIMIT 1)
            );
            
            RAISE NOTICE 'Se creó un registro de acceso de ejemplo en user_obras';
        ELSE
            RAISE NOTICE 'No hay usuarios o obras disponibles para crear registros de acceso';
        END IF;
    ELSE
        RAISE NOTICE 'Ya existen registros en user_obras';
    END IF;
END $$;

-- Verificar el resultado final
SELECT 
    'Estado final de user_obras:' as info,
    COUNT(*) as total_registros
FROM user_obras;

-- Verificar que las políticas RLS estén funcionando
SELECT 
    'Políticas RLS activas para kpis:' as info,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'kpis' AND schemaname = 'public'
ORDER BY policyname;