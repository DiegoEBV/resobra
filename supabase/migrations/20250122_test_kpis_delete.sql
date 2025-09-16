-- Script de prueba para verificar eliminación de KPIs
-- Fecha: 2025-01-22
-- Propósito: Probar que las políticas RLS permiten eliminar KPIs correctamente

-- Verificar políticas actuales de eliminación
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'kpis' 
AND cmd = 'DELETE';

-- Verificar permisos de la tabla kpis
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'kpis' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- Verificar que existen KPIs para probar
SELECT 
    id,
    obra_id,
    actividad_id,
    fecha,
    created_by,
    estado
FROM kpis 
LIMIT 5;

-- Verificar relaciones user_obras para entender qué usuarios pueden eliminar qué KPIs
SELECT 
    uo.user_id,
    uo.obra_id,
    uo.rol_obra,
    o.nombre as obra_nombre
FROM user_obras uo
JOIN obras o ON uo.obra_id = o.id
LIMIT 5;

-- Verificar si hay KPIs que coincidan con las obras asignadas
SELECT 
    k.id as kpi_id,
    k.obra_id,
    k.actividad_id,
    k.created_by,
    uo.user_id,
    uo.rol_obra,
    o.nombre as obra_nombre
FROM kpis k
JOIN user_obras uo ON k.obra_id = uo.obra_id
JOIN obras o ON k.obra_id = o.id
LIMIT 5;