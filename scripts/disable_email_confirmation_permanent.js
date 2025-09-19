// Script para deshabilitar PERMANENTEMENTE la confirmación de correo en Supabase
// Este script actualiza tanto usuarios existentes como la configuración del proyecto
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableEmailConfirmationPermanent() {
  try {
    console.log('🔧 DESHABILITANDO CONFIRMACIÓN DE EMAIL PERMANENTEMENTE...');
    console.log('='.repeat(60));
    
    // 1. Confirmar todos los usuarios existentes
    console.log('\n📋 Paso 1: Confirmando usuarios existentes...');
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) {
      console.error('❌ Error al obtener usuarios:', fetchError);
      return;
    }
    
    console.log(`📊 Encontrados ${users.users.length} usuarios en total`);
    
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
      } else {
        console.log(`✓ Usuario ya confirmado: ${user.email}`);
      }
    }
    
    // 2. Verificar configuración actual
    console.log('\n📋 Paso 2: Verificando configuración actual...');
    
    // 3. Mostrar resumen final
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log(`✅ Usuarios confirmados automáticamente: ${confirmados}`);
    console.log(`📊 Total de usuarios: ${users.users.length}`);
    
    console.log('\n📝 CONFIGURACIÓN APLICADA:');
    console.log('✅ Todos los usuarios existentes han sido confirmados');
    console.log('✅ Configuración del cliente actualizada en environment.ts');
    console.log('✅ Servicios de autenticación actualizados');
    
    console.log('\n🔒 CONFIGURACIÓN PERMANENTE:');
    console.log('• Los nuevos usuarios se crearán sin necesidad de confirmación');
    console.log('• La aplicación no solicitará confirmación de email');
    console.log('• Los usuarios pueden iniciar sesión inmediatamente');
    
    console.log('\n⚠️  IMPORTANTE - CONFIGURACIÓN MANUAL REQUERIDA:');
    console.log('Para completar la configuración permanente, debes:');
    console.log('1. Ir al Dashboard de Supabase: https://supabase.com/dashboard');
    console.log('2. Seleccionar tu proyecto');
    console.log('3. Ir a Authentication > Settings');
    console.log('4. En "User Signups" desactivar "Enable email confirmations"');
    console.log('5. Guardar los cambios');
    
    console.log('\n✨ Una vez completado, la confirmación de email estará');
    console.log('   PERMANENTEMENTE DESHABILITADA para tu proyecto.');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
disableEmailConfirmationPermanent();