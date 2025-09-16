-- Prueba realista para verificar que el campo nombre acepta hasta 1000 caracteres
-- Crear una obra de prueba con nombre de aproximadamente 500 caracteres (más realista)

INSERT INTO public.obras (
    nombre,
    descripcion,
    ubicacion,
    fecha_inicio,
    fecha_fin_estimada,
    estado
) VALUES (
    -- Nombre de aproximadamente 500 caracteres (realista para una obra)
    'CONSTRUCCIÓN DE EDIFICIO MULTIFAMILIAR DE 15 PISOS CON SÓTANOS PARA ESTACIONAMIENTO Y ÁREAS COMERCIALES EN EL PRIMER NIVEL - PROYECTO RESIDENCIAL LOS JARDINES DE SAN ISIDRO FASE II - INCLUYE SISTEMA DE TRATAMIENTO DE AGUAS RESIDUALES, PANELES SOLARES, SISTEMA DE SEGURIDAD INTEGRADO, ÁREAS VERDES PAISAJÍSTICAS, GIMNASIO, PISCINA, SALÓN DE USOS MÚLTIPLES Y ZONA DE JUEGOS INFANTILES - CUMPLE CON NORMATIVA SISMORRESISTENTE E-030 Y REGLAMENTO NACIONAL DE EDIFICACIONES',
    'Proyecto residencial moderno con tecnologías sostenibles y amenidades completas para familias',
    'Av. Javier Prado Este 1234, San Isidro, Lima',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '18 months',
    'planificacion'
);

-- Verificar que la obra se creó correctamente
SELECT 
    id,
    LENGTH(nombre) as longitud_nombre,
    nombre,
    ubicacion,
    estado,
    created_at
FROM public.obras 
WHERE nombre LIKE 'CONSTRUCCIÓN DE EDIFICIO MULTIFAMILIAR%'
ORDER BY created_at DESC
LIMIT 1;

-- Verificar que se asignó automáticamente a los usuarios
SELECT 
    uo.user_id,
    u.nombre as usuario_nombre,
    o.id as obra_id,
    LEFT(o.nombre, 80) || '...' as obra_nombre_preview
FROM user_obras uo
JOIN public.users u ON uo.user_id = u.id
JOIN public.obras o ON uo.obra_id = o.id
WHERE o.nombre LIKE 'CONSTRUCCIÓN DE EDIFICIO MULTIFAMILIAR%'
ORDER BY o.created_at DESC;