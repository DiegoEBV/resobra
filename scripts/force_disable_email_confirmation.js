const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function forceDisableEmailConfirmation() {
  try {
    console.log('🚀 FORZANDO DESHABILITACIÓN TOTAL DE CONFIRMACIÓN DE EMAIL...');
    
    // 1. Confirmar TODOS los usuarios existentes
    console.log('\n1️⃣ Confirmando TODOS los usuarios...');
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('❌ Error obteniendo usuarios:', fetchError);
      return;
    }
    
    console.log(`📊 Encontrados ${users.users.length} usuarios`);
    
    for (const user of users.users) {
      if (!user.email_confirmed_at) {
        console.log(`📧 Confirmando usuario: ${user.email}`);
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            email_confirm: true
          }
        );
        
        if (updateError) {
          console.error(`❌ Error confirmando ${user.email}:`, updateError);
        } else {
          console.log(`✅ Usuario confirmado: ${user.email}`);
        }
      } else {
        console.log(`✓ Usuario ya confirmado: ${user.email}`);
      }
    }
    
    // 2. Actualizar directamente en la base de datos
    console.log('\n2️⃣ Actualizando directamente en auth.users...');
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE auth.users 
        SET 
          email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
          confirmed_at = COALESCE(confirmed_at, NOW())
        WHERE email_confirmed_at IS NULL OR confirmed_at IS NULL;
      `
    });
    
    if (sqlError) {
      console.log('⚠️ No se pudo ejecutar SQL directo (normal en algunos casos)');
    } else {
      console.log('✅ Actualización SQL exitosa');
    }
    
    // 3. Verificar estado final
    console.log('\n3️⃣ Verificando estado final...');
    const { data: finalUsers, error: finalError } = await supabase.auth.admin.listUsers();
    
    if (finalError) {
      console.error('❌ Error en verificación final:', finalError);
      return;
    }
    
    const unconfirmedCount = finalUsers.users.filter(u => !u.email_confirmed_at).length;
    const confirmedCount = finalUsers.users.filter(u => u.email_confirmed_at).length;
    
    console.log(`\n📊 ESTADO FINAL:`);
    console.log(`✅ Usuarios confirmados: ${confirmedCount}`);
    console.log(`❌ Usuarios sin confirmar: ${unconfirmedCount}`);
    
    if (unconfirmedCount === 0) {
      console.log('\n🎉 ¡TODOS LOS USUARIOS ESTÁN CONFIRMADOS!');
    } else {
      console.log('\n⚠️ Aún hay usuarios sin confirmar');
    }
    
    console.log('\n🔧 CONFIGURACIÓN ADICIONAL REQUERIDA:');
    console.log('1. Ve al Dashboard de Supabase');
    console.log('2. Authentication > Settings');
    console.log('3. Desactiva "Enable email confirmations"');
    console.log('4. Guarda los cambios');
    
    console.log('\n✨ El login debería funcionar sin problemas ahora');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
forceDisableEmailConfirmation();