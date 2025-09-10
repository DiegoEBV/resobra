// Script para insertar usuarios predefinidos en Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ugecshlhptnveemmedov.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Necesita ser la clave de servicio, no la clave anónima

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_KEY no está definida en el archivo .env');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo SQL
const sqlFilePath = path.resolve(__dirname, '../supabase/migrations/insert_predefined_users.sql');
const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');

async function insertUsers() {
  try {
    // Crear usuarios en Auth
    console.log('Creando usuarios en Auth...');
    
    // Crear usuario RESIDENTE@CVH.COM
    const { data: residenteData, error: residenteError } = await supabase.auth.admin.createUser({
      email: 'RESIDENTE@CVH.COM',
      password: '123456',
      email_confirm: true
    });
    
    if (residenteError) {
      console.error('Error al crear usuario residente:', residenteError);
    } else {
      console.log('Usuario residente creado:', residenteData.user.email);
    }
    
    // Crear usuario PRODUCCION@CVH.COM
    const { data: produccionData, error: produccionError } = await supabase.auth.admin.createUser({
      email: 'PRODUCCION@CVH.COM',
      password: '123456',
      email_confirm: true
    });
    
    if (produccionError) {
      console.error('Error al crear usuario producción:', produccionError);
    } else {
      console.log('Usuario producción creado:', produccionData.user.email);
    }
    
    // Ejecutar el script SQL para insertar en la base de datos
    console.log('Ejecutando script SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql: sqlQuery });
    
    if (error) {
      console.error('Error al ejecutar el script SQL:', error);
    } else {
      console.log('Script SQL ejecutado correctamente');
    }
    
    console.log('Proceso completado');
  } catch (error) {
    console.error('Error en el proceso:', error);
  }
}

// Ejecutar la función
insertUsers();