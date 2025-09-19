// Script para deshabilitar la confirmación de correo en Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableEmailConfirmation() {
  try {
    console.log('🔧 Configurando Supabase para deshabilitar confirmación de correo...');
    
    // Nota: La configuración de confirmación de correo se maneja principalmente 
    // desde el dashboard de Supabase en Authentication > Settings
    // Este script actualiza usuarios existentes para marcarlos como confirmados
    
    // 1. Obtener todos los usuarios no confirmados
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('❌ Error al obtener usuarios:', fetchError);
      return;
    }
    
    console.log(`📋 Encontrados ${users.users.length} usuarios en total`);
    
    // 2. Confirmar automáticamente usuarios no confirmados
    let confirmados = 0;
    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        console.log(`📧 Confirmando usuario: ${user.email}`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { 
            email_confirm: true,
            email_confirmed_at: new Date().toISOString()
          }
        );
        
        if (updateError) {
          console.error(`❌ Error al confirmar ${user.email}:`, updateError);
        } else {
          confirmados++;
          console.log(`✅ Usuario confirmado: ${user.email}`);
        }
      }
    }
    
    console.log(`\n🎉 Proceso completado:`);
    console.log(`   - Usuarios confirmados automáticamente: ${confirmados}`);
    console.log(`   - Total de usuarios: ${users.users.length}`);
    
    console.log('\n📝 IMPORTANTE:');
    console.log('   Para deshabilitar completamente la confirmación de correo,');
    console.log('   también debes configurar en el Dashboard de Supabase:');
    console.log('   1. Ir a Authentication > Settings');
    console.log('   2. Desactivar "Enable email confirmations"');
    console.log('   3. Guardar los cambios');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
disableEmailConfirmation();