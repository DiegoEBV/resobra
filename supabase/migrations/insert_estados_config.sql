-- Insertar configuración de estados con colores para visualización kilométrica
INSERT INTO estados_config (estado_nombre, color_hex, umbral_minimo, umbral_maximo, activo) VALUES
('no_iniciado', '#9CA3AF', 0, 0, true),
('en_progreso', '#F59E0B', 1, 99, true),
('completado', '#10B981', 100, 100, true),
('pausado', '#EF4444', 0, 100, true)
ON CONFLICT (estado_nombre) DO UPDATE SET
    color_hex = EXCLUDED.color_hex,
    umbral_minimo = EXCLUDED.umbral_minimo,
    umbral_maximo = EXCLUDED.umbral_maximo,
    activo = EXCLUDED.activo;

-- Actualizar colores de kilómetros existentes basado en su estado
UPDATE kilometros 
SET color = (
    SELECT color_hex 
    FROM estados_config 
    WHERE estado_nombre = kilometros.estado 
    AND activo = true
)
WHERE EXISTS (
    SELECT 1 
    FROM estados_config 
    WHERE estado_nombre = kilometros.estado 
    AND activo = true
);

-- Verificar la actualización
SELECT 
    k.kilometro,
    k.estado,
    k.color,
    k.progreso_porcentaje,
    f.nombre as frente_nombre
FROM kilometros k
JOIN frentes f ON k.frente_id = f.id
ORDER BY f.nombre, k.kilometro;