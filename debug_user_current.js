const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserObras() {
  console.log('🔍 Iniciando diagnóstico de usuario y obras...');
  
  try {
    // 1. Verificar todos los usuarios en auth.users
    console.log('\n📋 1. Consultando usuarios en auth.users:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError);
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuarios en auth:`);
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Email: ${user.email}, Created: ${user.created_at}`);
      });
    }

    // 2. Verificar usuarios en la tabla profiles/users
    console.log('\n📋 2. Consultando tabla auth.users directamente:');
    const { data: dbUsers, error: dbError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10);
    
    if (dbError) {
      console.log('⚠️ No se pudo consultar auth.users directamente:', dbError.message);
    } else {
      console.log(`✅ Usuarios encontrados en DB: ${dbUsers?.length || 0}`);
    }

    // 3. Verificar tabla user_obras
    console.log('\n📋 3. Consultando tabla user_obras:');
    const { data: userObras, error: userObrasError } = await supabase
      .from('user_obras')
      .select('*')
      .limit(20);
    
    if (userObrasError) {
      console.error('❌ Error consultando user_obras:', userObrasError);
    } else {
      console.log(`✅ Registros en user_obras: ${userObras?.length || 0}`);
      if (userObras && userObras.length > 0) {
        userObras.forEach((uo, index) => {
          console.log(`   ${index + 1}. User ID: ${uo.user_id}, Obra ID: ${uo.obra_id}, Rol: ${uo.rol}`);
        });
      }
    }

    // 4. Verificar tabla obras
    console.log('\n📋 4. Consultando tabla obras:');
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('id, nombre, descripcion')
      .limit(10);
    
    if (obrasError) {
      console.error('❌ Error consultando obras:', obrasError);
    } else {
      console.log(`✅ Obras disponibles: ${obras?.length || 0}`);
      if (obras && obras.length > 0) {
        obras.forEach((obra, index) => {
          console.log(`   ${index + 1}. ID: ${obra.id}, Nombre: ${obra.nombre}`);
        });
      }
    }

    // 5. Probar la consulta exacta que usa getUserObras()
    console.log('\n📋 5. Probando consulta getUserObras() con diferentes user_ids:');
    
    if (authUsers && authUsers.users.length > 0) {
      for (const user of authUsers.users.slice(0, 3)) { // Solo los primeros 3 usuarios
        console.log(`\n🔍 Probando con usuario: ${user.email} (${user.id})`);
        
        const { data: testUserObras, error: testError } = await supabase
          .from('user_obras')
          .select(`
            obra_id,
            obras(*)
          `)
          .eq('user_id', user.id);
        
        if (testError) {
          console.error(`❌ Error para usuario ${user.email}:`, testError);
        } else {
          console.log(`✅ Obras para ${user.email}: ${testUserObras?.length || 0}`);
          if (testUserObras && testUserObras.length > 0) {
            testUserObras.forEach((uo, index) => {
              console.log(`   ${index + 1}. Obra: ${uo.obras?.nombre || 'Sin nombre'}`);
            });
          }
        }
      }
    }

    // 6. Verificar permisos RLS
    console.log('\n📋 6. Verificando permisos RLS:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'user_obras' })
      .limit(5);
    
    if (policiesError) {
      console.log('⚠️ No se pudieron obtener las políticas RLS:', policiesError.message);
    } else {
      console.log(`✅ Políticas RLS encontradas: ${policies?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugUserObras().then(() => {
  console.log('\n🏁 Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});