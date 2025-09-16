-- Actualizar el frente de pavimentación con coordenadas de inicio y fin para la vista kilométrica
UPDATE frentes 
SET 
    coordenadas_inicio = '{"lat": 4.6097, "lng": -74.0817}',
    coordenadas_fin = '{"lat": 4.6150, "lng": -74.0750}',
    km_inicial = 0.0,
    km_final = 0.5
WHERE nombre = 'Frente de Pavimentación';

-- Verificar la actualización
SELECT 
    nombre,
    coordenadas_inicio,
    coordenadas_fin,
    km_inicial,
    km_final,
    ubicacion_lat,
    ubicacion_lng
FROM frentes 
WHERE nombre = 'Frente de Pavimentación';