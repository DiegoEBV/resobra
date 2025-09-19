const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserObrasData() {
  try {
    console.log('🔍 Verificando datos en user_obras...');
    
    // 1. Verificar todos los registros en user_obras
    const { data: userObras, error: userObrasError } = await supabase
      .from('user_obras')
      .select('*');
    
    if (userObrasError) {
      console.error('❌ Error al consultar user_obras:', userObrasError);
      return;
    }
    
    console.log(`📊 Total de registros en user_obras: ${userObras?.length || 0}`);
    
    if (userObras && userObras.length > 0) {
      console.log('📋 Registros encontrados:');
      userObras.forEach((registro, index) => {
        console.log(`  ${index + 1}. User ID: ${registro.user_id}, Obra ID: ${registro.obra_id}, Rol: ${registro.rol_obra}`);
      });
    } else {
      console.log('⚠️  No hay registros en user_obras');
    }
    
    // 2. Verificar usuarios existentes
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nombre');
    
    if (usersError) {
      console.error('❌ Error al consultar users:', usersError);
      return;
    }
    
    console.log(`👥 Total de usuarios: ${users?.length || 0}`);
    
    // 3. Verificar obras existentes
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('id, nombre');
    
    if (obrasError) {
      console.error('❌ Error al consultar obras:', obrasError);
      return;
    }
    
    console.log(`🏗️  Total de obras: ${obras?.length || 0}`);
    
    // 4. Verificar si hay usuarios sin obras asignadas
    if (users && users.length > 0) {
      console.log('\n🔍 Verificando usuarios sin obras asignadas:');
      for (const user of users) {
        const userHasObras = userObras?.some(uo => uo.user_id === user.id);
        if (!userHasObras) {
          console.log(`  ⚠️  Usuario sin obras: ${user.email} (${user.nombre})`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar la verificación
checkUserObrasData();