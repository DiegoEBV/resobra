-- Verificar usuarios existentes
SELECT 'Usuarios en auth.users:' as info;
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;

SELECT 'Usuarios en public.users:' as info;
SELECT id, email, nombre, rol, created_at 
FROM public.users 
ORDER BY created_at DESC;

-- Verificar si el usuario residente@cvh.com existe en auth.users
SELECT 'Usuario residente@cvh.com en auth.users:' as info;
SELECT id, email, created_at, email_confirmed_at, confirmed_at
FROM auth.users 
WHERE email = 'residente@cvh.com';

-- Si no existe, crearlo
DO $$
BEGIN
    -- Verificar si el usuario ya existe en auth.users
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'residente@cvh.com') THEN
        -- Insertar en auth.users
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmed_at,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            gen_random_uuid(),
            'residente@cvh.com',
            crypt('123456', gen_salt('bf')),
            now(),
            now(),
            now(),
            now(),
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE 'Usuario residente@cvh.com creado en auth.users';
    ELSE
        RAISE NOTICE 'Usuario residente@cvh.com ya existe en auth.users';
    END IF;
END $$;

-- Verificar y crear usuario en public.users
DO $$
DECLARE
    user_auth_id uuid;
BEGIN
    -- Obtener el ID del usuario de auth.users
    SELECT id INTO user_auth_id FROM auth.users WHERE email = 'residente@cvh.com';
    
    IF user_auth_id IS NOT NULL THEN
        -- Verificar si ya existe en public.users
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = user_auth_id) THEN
            INSERT INTO public.users (id, email, nombre, rol)
            VALUES (user_auth_id, 'residente@cvh.com', 'Usuario Residente', 'residente');
            
            RAISE NOTICE 'Usuario residente@cvh.com creado en public.users';
        ELSE
            RAISE NOTICE 'Usuario residente@cvh.com ya existe en public.users';
        END IF;
    END IF;
END $$;

-- Verificar resultado final
SELECT 'Verificación final:' as info;
SELECT 
    au.id,
    au.email,
    au.email_confirmed_at,
    au.confirmed_at,
    pu.nombre,
    pu.rol
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'residente@cvh.com';