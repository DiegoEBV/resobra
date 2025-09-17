-- Migración para corregir la tabla users y asegurar que los usuarios existan
-- Este script verifica y crea los usuarios necesarios

-- Primero, verificar la estructura actual
SELECT 'Usuarios actuales en auth.users:' as info;
SELECT id, email, email_confirmed_at FROM auth.users ORDER BY created_at;

SELECT 'Usuarios actuales en public.users:' as info;
SELECT id, email, nombre, rol FROM public.users ORDER BY created_at;

-- Insertar usuarios en public.users basándose en auth.users existentes
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Para cada usuario en auth.users, crear entrada en public.users si no existe
    FOR auth_user IN 
        SELECT id, email FROM auth.users 
        WHERE email_confirmed_at IS NOT NULL
    LOOP
        -- Insertar en public.users si no existe
        INSERT INTO public.users (id, email, nombre, rol, created_at, updated_at)
        VALUES (
            auth_user.id,
            auth_user.email,
            CASE 
                WHEN UPPER(auth_user.email) LIKE '%RESIDENTE%' THEN 'Residente'
                WHEN UPPER(auth_user.email) LIKE '%PRODUCCION%' THEN 'Producción'
                ELSE 'Usuario'
            END,
            CASE 
                WHEN UPPER(auth_user.email) LIKE '%RESIDENTE%' THEN 'residente'
                ELSE 'logistica'
            END,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            nombre = EXCLUDED.nombre,
            rol = EXCLUDED.rol,
            updated_at = NOW();
            
        RAISE NOTICE 'Usuario sincronizado: % con rol %', 
            auth_user.email, 
            CASE WHEN UPPER(auth_user.email) LIKE '%RESIDENTE%' THEN 'residente' ELSE 'logistica' END;
    END LOOP;
END $$;

-- Verificar resultado final
SELECT 'Resultado final - usuarios sincronizados:' as info;
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.rol,
    au.email_confirmed_at IS NOT NULL as auth_confirmado
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at;