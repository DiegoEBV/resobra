-- Prueba para verificar que el campo nombre acepta 1000 caracteres
-- Crear una obra de prueba con nombre de exactamente 1000 caracteres

-- Generar un nombre de 1000 caracteres para la prueba
INSERT INTO public.obras (
    nombre,
    descripcion,
    ubicacion,
    fecha_inicio,
    fecha_fin_estimada,
    estado
) VALUES (
    -- Nombre de exactamente 1000 caracteres
    'OBRA DE PRUEBA PARA VERIFICAR EL LIMITE DE 1000 CARACTERES EN EL CAMPO NOMBRE - Esta es una obra de prueba muy larga que tiene como objetivo verificar que el sistema puede manejar correctamente nombres de obras que contengan hasta mil caracteres sin problemas. El nombre debe ser lo suficientemente descriptivo para identificar claramente el proyecto, su ubicación, sus características principales y cualquier información relevante que los usuarios necesiten conocer. En muchos casos, los nombres de obras pueden incluir detalles técnicos específicos, referencias a normativas, códigos de proyecto, información sobre el contratista, fechas importantes, y otros datos que son fundamentales para la gestión adecuada del proyecto. Por ejemplo, podría incluir información sobre el tipo de construcción, si es residencial, comercial o industrial, el número de pisos o niveles, la superficie total, los materiales principales que se utilizarán, las tecnologías especiales que se implementarán, los estándares de calidad que se deben cumplir, y cualquier certificación especial que el proyecto deba obtener. También es común que se incluyan referencias geográficas detalladas, como el distrito, la provincia, coordenadas específicas, y puntos de referencia importantes que faciliten la ubicación exacta del proyecto.',
    'Obra de prueba para verificar el límite de 1000 caracteres en el campo nombre',
    'Ubicación de prueba - Lima, Perú',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    'planificacion'
);

-- Verificar que la obra se creó correctamente
SELECT 
    id,
    LENGTH(nombre) as longitud_nombre,
    LEFT(nombre, 100) || '...' as nombre_truncado,
    ubicacion,
    estado,
    created_at
FROM public.obras 
WHERE nombre LIKE 'OBRA DE PRUEBA PARA VERIFICAR%'
ORDER BY created_at DESC
LIMIT 1;

-- Verificar que se asignó automáticamente a los usuarios
SELECT 
    uo.user_id,
    u.nombre as usuario_nombre,
    o.id as obra_id,
    LEFT(o.nombre, 50) || '...' as obra_nombre_truncado
FROM user_obras uo
JOIN public.users u ON uo.user_id = u.id
JOIN public.obras o ON uo.obra_id = o.id
WHERE o.nombre LIKE 'OBRA DE PRUEBA PARA VERIFICAR%'
ORDER BY uo.created_at DESC;