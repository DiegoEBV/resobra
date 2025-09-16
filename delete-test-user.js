const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Usuario identificado como de prueba
const TEST_USER_ID = 'b5364f15-cdde-4ba0-bb06-6e1b1940978b';
const TEST_USER_EMAIL = 'residene@cvh.com';

async function deleteTestUser() {
  console.log('🗑️ Iniciando eliminación de usuario de prueba...');
  console.log('Usuario a eliminar:', TEST_USER_EMAIL);
  console.log('ID:', TEST_USER_ID);
  
  try {
    // 1. Verificar que el usuario existe y es realmente de prueba
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios:', authError);
      return;
    }
    
    const testUser = authUsers.users.find(user => user.id === TEST_USER_ID);
    
    if (!testUser) {
      console.log('⚠️ Usuario no encontrado. Puede que ya haya sido eliminado.');
      return;
    }
    
    console.log('✅ Usuario encontrado:', testUser.email);
    console.log('Último login:', testUser.last_sign_in_at || 'Nunca');
    console.log('Confirmado:', testUser.email_confirmed_at ? 'Sí' : 'No');
    
    // Confirmar que es un usuario de prueba (nunca se logueó y email con error tipográfico)
    if (testUser.last_sign_in_at || testUser.email !== TEST_USER_EMAIL) {
      console.log('⚠️ ADVERTENCIA: Este usuario puede no ser de prueba. Cancelando eliminación por seguridad.');
      return;
    }
    
    // 2. Eliminar registros relacionados en orden correcto
    const tables = ['evidencias_fotograficas', 'evaluaciones', 'actividades'];
    
    for (const table of tables) {
      try {
        console.log(`\n🧹 Limpiando registros en tabla: ${table}`);
        
        // Verificar si hay registros
        const { data: records, error: selectError } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', TEST_USER_ID);
        
        if (selectError) {
          console.log(`⚠️ No se pudo acceder a la tabla ${table}:`, selectError.message);
          continue;
        }
        
        if (records && records.length > 0) {
          console.log(`Encontrados ${records.length} registros en ${table}`);
          
          // Eliminar registros
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('user_id', TEST_USER_ID);
          
          if (deleteError) {
            console.error(`❌ Error eliminando registros de ${table}:`, deleteError);
            return;
          }
          
          console.log(`✅ Eliminados ${records.length} registros de ${table}`);
        } else {
          console.log(`✅ No hay registros en ${table} para este usuario`);
        }
        
      } catch (err) {
        console.log(`⚠️ Tabla ${table} no accesible o no existe`);
      }
    }
    
    // 3. Eliminar de profiles si existe
    try {
      console.log('\n🧹 Verificando tabla profiles...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', TEST_USER_ID)
        .single();
      
      if (!profileError && profile) {
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', TEST_USER_ID);
        
        if (deleteProfileError) {
          console.error('❌ Error eliminando perfil:', deleteProfileError);
          return;
        }
        
        console.log('✅ Perfil eliminado de la tabla profiles');
      } else {
        console.log('✅ No hay perfil en la tabla profiles para este usuario');
      }
    } catch (err) {
      console.log('⚠️ Tabla profiles no accesible o no existe');
    }
    
    // 4. Finalmente, eliminar el usuario de auth
    console.log('\n🗑️ Eliminando usuario del sistema de autenticación...');
    
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(TEST_USER_ID);
    
    if (deleteAuthError) {
      console.error('❌ Error eliminando usuario de auth:', deleteAuthError);
      return;
    }
    
    console.log('✅ Usuario eliminado exitosamente del sistema de autenticación');
    
    // 5. Verificar eliminación
    console.log('\n🔍 Verificando eliminación...');
    
    const { data: verifyUsers, error: verifyError } = await supabase.auth.admin.listUsers();
    
    if (!verifyError) {
      const stillExists = verifyUsers.users.find(user => user.id === TEST_USER_ID);
      
      if (stillExists) {
        console.log('❌ ERROR: El usuario aún existe en el sistema');
      } else {
        console.log('✅ CONFIRMADO: Usuario eliminado completamente');
        console.log('\n🎉 ELIMINACIÓN EXITOSA');
        console.log('Usuario de prueba eliminado:', TEST_USER_EMAIL);
        console.log('Todos los registros relacionados han sido limpiados');
      }
    }
    
  } catch (error) {
    console.error('❌ Error general durante la eliminación:', error);
  }
}

// Ejecutar con confirmación
console.log('⚠️ ADVERTENCIA: Este script eliminará permanentemente el usuario de prueba');
console.log('Usuario a eliminar:', TEST_USER_EMAIL);
console.log('\nEjecutando en 3 segundos...');

setTimeout(() => {
  deleteTestUser();
}, 3000);