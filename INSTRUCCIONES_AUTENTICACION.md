# Instrucciones para Resolver Problemas de Autenticación

## Problema

La aplicación no funciona correctamente porque las tablas `users` y `user_obras` no tienen registradas las credenciales necesarias para los usuarios predefinidos:

- RESIDENTE: RESIDENTE@CVH.COM / 123456
- PRODUCCIÓN: PRODUCCION@CVH.COM / 123456

## Solución

Hay varias formas de resolver este problema:

### Opción 1: Usar la interfaz web

1. Abre el archivo `C:\Users\dballon\Documents\residente\resobra\scripts\create_users.html` en tu navegador
2. Ingresa la clave anónima de Supabase en el campo correspondiente
3. Haz clic en el botón "Crear Usuarios"
4. Verifica que los usuarios se hayan creado correctamente con el botón "Verificar Usuarios"

### Opción 2: Ejecutar script SQL en la consola de Supabase

1. Accede al panel de administración de Supabase: https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor"
4. Copia y pega el contenido del archivo `C:\Users\dballon\Documents\residente\resobra\scripts\insert_direct_users.sql`
5. Ejecuta el script

### Opción 3: Usar la API de Supabase desde Node.js

1. Asegúrate de tener Node.js instalado
2. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```
   SUPABASE_URL=https://ugecshlhptnveemmedov.supabase.co
   SUPABASE_SERVICE_KEY=tu_clave_de_servicio
   ```
3. Ejecuta el siguiente comando:
   ```
   node scripts/insert_users.js
   ```

## Credenciales de Acceso

Una vez que los usuarios estén creados, podrás iniciar sesión con las siguientes credenciales:

- **RESIDENTE:**
  - Email: RESIDENTE@CVH.COM
  - Contraseña: 123456

- **PRODUCCIÓN:**
  - Email: PRODUCCION@CVH.COM
  - Contraseña: 123456

## Verificación

Para verificar que los usuarios se han creado correctamente:

1. Inicia la aplicación con `npm run start`
2. Accede a http://localhost:4200/login
3. Intenta iniciar sesión con las credenciales mencionadas anteriormente

## Notas Adicionales

- Si sigues teniendo problemas, verifica que la tabla `users` en Supabase tenga los registros correspondientes
- Asegúrate de que la tabla `user_obras` tenga asignaciones para los usuarios
- Si es necesario, puedes modificar el archivo `auth.service.ts` para ajustar la lógica de autenticación