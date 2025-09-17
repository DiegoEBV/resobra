const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creando usuario de prueba...');
    
    // Crear usuario usando Admin API
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@resobra.com',
      password: '123456',
      email_confirm: true,
      user_metadata: {
        nombre: 'Usuario de Prueba',
        rol: 'residente'
      }
    });
    
    if (userError) {
      console.error('Error al crear usuario:', userError.message);
      return;
    }
    
    console.log('Usuario creado exitosamente:', userData.user.id);
    
    // Insertar en tabla users
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: userData.user.id,
        email: 'test@resobra.com',
        nombre: 'Usuario de Prueba',
        rol: 'residente'
      });
    
    if (insertError) {
      console.error('Error al insertar en tabla users:', insertError.message);
      return;
    }
    
    console.log('Usuario insertado en tabla users exitosamente');
    
    // Verificar si hay obras y asignar usuario
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('id')
      .limit(1);
    
    if (obrasError) {
      console.error('Error al verificar obras:', obrasError.message);
      return;
    }
    
    if (obras && obras.length > 0) {
      const { error: assignError } = await supabase
        .from('user_obras')
        .upsert({
          user_id: userData.user.id,
          obra_id: obras[0].id,
          rol_obra: 'residente'
        });
      
      if (assignError) {
        console.error('Error al asignar usuario a obra:', assignError.message);
      } else {
        console.log('Usuario asignado a obra exitosamente');
      }
    }
    
    console.log('\n=== USUARIO DE PRUEBA CREADO ===');
    console.log('Email: test@resobra.com');
    console.log('Password: 123456');
    console.log('Rol: residente');
    console.log('ID:', userData.user.id);
    
  } catch (error) {
    console.error('Error general:', error.message);
  }
}

// Ejecutar la función
createTestUser();