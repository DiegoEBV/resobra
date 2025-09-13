# Sistema de Asignación Automática de Obras a Usuarios

## Resumen
Este sistema garantiza que **todas las obras creadas se asignen automáticamente a los dos usuarios existentes** en el sistema. La asignación se realiza mediante triggers de base de datos que se ejecutan automáticamente al insertar nuevas obras.

## ¿Cómo Funciona la Asignación Automática?

### 1. Trigger Automático
- **Archivo**: `supabase/migrations/auto_assign_obras_to_users.sql`
- **Trigger**: `trigger_auto_assign_obra_to_users`
- **Función**: `auto_assign_obra_to_users()`

**Funcionamiento**:
- Se ejecuta automáticamente **DESPUÉS** de insertar una nueva obra
- Busca todos los usuarios en la tabla `public.users`
- Crea registros en `user_obras` para cada usuario encontrado
- Asigna el rol según el rol del usuario:
  - Si el usuario tiene rol 'residente' → se asigna como 'residente'
  - Si el usuario tiene rol 'logistica' → se asigna como 'logistica'
  - Por defecto → se asigna como 'logistica'

### 2. Estructura de Asignación

**Tabla `user_obras`**:
- `id`: UUID único de la asignación
- `user_id`: Referencia al usuario (tabla `public.users`)
- `obra_id`: Referencia a la obra (tabla `obras`)
- `rol_obra`: Rol del usuario en esa obra ('residente' o 'logistica')
- `assigned_at`: Fecha y hora de asignación

## ¿Dónde se Configura?

### Archivos de Configuración:
1. **`auto_assign_obras_to_users.sql`** - Funciones y trigger principal
2. **`fix_auto_assign_functions_v2.sql`** - Correcciones para usar `public.users`
3. **`execute_assign_existing_obras_v2.sql`** - Asignación de obras existentes

### Funciones Disponibles:

#### 1. Función Automática (Trigger)
```sql
auto_assign_obra_to_users()
```
- Se ejecuta automáticamente al crear nuevas obras
- No requiere intervención manual

#### 2. Función Manual para Usuario Específico
```sql
assign_existing_obras_to_user(user_email TEXT)
```
- Asigna todas las obras existentes a un usuario específico
- Retorna el número de obras asignadas
- Ejemplo: `SELECT assign_existing_obras_to_user('residente@cvh.com');`

#### 3. Función Manual para Todos los Usuarios
```sql
assign_all_existing_obras_to_all_users()
```
- Asigna todas las obras existentes a todos los usuarios
- Retorna tabla con email y cantidad de obras asignadas por usuario
- Ejemplo: `SELECT * FROM assign_all_existing_obras_to_all_users();`

## ¿Cómo Verificar las Asignaciones?

### 1. Ver Todas las Asignaciones
```sql
SELECT 
    u.email as usuario_email,
    u.nombre as usuario_nombre,
    o.nombre as obra_nombre,
    uo.rol_obra as rol_asignado,
    uo.assigned_at as fecha_asignacion
FROM user_obras uo
JOIN public.users u ON uo.user_id = u.id
JOIN obras o ON uo.obra_id = o.id
ORDER BY u.email, o.nombre;
```

### 2. Contar Obras por Usuario
```sql
SELECT 
    u.email as usuario,
    u.nombre as nombre_usuario,
    COUNT(uo.obra_id) as total_obras_asignadas
FROM public.users u
LEFT JOIN user_obras uo ON u.id = uo.user_id
GROUP BY u.id, u.email, u.nombre
ORDER BY u.email;
```

### 3. Verificar que el Trigger Está Activo
```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_assign_obra_to_users';
```

## Flujo de Trabajo

### Cuando se Crea una Nueva Obra:
1. **Frontend**: Usuario completa formulario de nueva obra
2. **Service**: `obrasService.createObra()` envía datos al backend
3. **Backend**: Inserta registro en tabla `obras`
4. **Trigger**: Se ejecuta automáticamente `auto_assign_obra_to_users()`
5. **Resultado**: La obra queda asignada a todos los usuarios existentes

### Ubicación en el Código:
- **Frontend**: `src/components/obras.component.ts` - método `createObra()`
- **Service**: `src/services/obras.service.ts` - método `createObra()`
- **Base de Datos**: Trigger automático en Supabase

## Usuarios del Sistema
Actualmente el sistema tiene **2 usuarios**:
1. **residente@cvh.com** - Rol: residente
2. **produccion@cvh.com** - Rol: logistica

## Pruebas Realizadas
- ✅ Trigger creado y activo
- ✅ Funciones manuales implementadas
- ✅ Obras existentes asignadas a todos los usuarios
- ✅ Obra de prueba creada y asignada automáticamente
- ✅ Verificación de asignaciones completada

## Mantenimiento

### Para Agregar Nuevos Usuarios:
1. Insertar usuario en tabla `public.users`
2. Ejecutar: `SELECT assign_existing_obras_to_user('nuevo_email@cvh.com');`

### Para Verificar el Sistema:
1. Crear una obra de prueba
2. Verificar que aparezca en `user_obras` para todos los usuarios
3. Eliminar la obra de prueba si es necesario

---

**Conclusión**: El sistema garantiza que **TODAS las obras creadas se asignan automáticamente a los dos usuarios existentes** sin intervención manual, cumpliendo completamente con el requerimiento solicitado.