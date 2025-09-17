-- Verificar configuración de estados y colores
SELECT 
    estado_nombre,
    color_hex,
    umbral_minimo,
    umbral_maximo,
    activo
FROM estados_config
ORDER BY umbral_minimo;

-- Verificar kilómetros y sus colores actuales
SELECT 
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    k.actividades_count,
    f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;

-- Contar kilómetros por estado
SELECT 
    estado,
    COUNT(*) as cantidad,
    AVG(progreso_porcentaje) as progreso_promedio
FROM kilometros
GROUP BY estado
ORDER BY cantidad DESC;