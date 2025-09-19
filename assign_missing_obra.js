const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignMissingObra() {
  try {
    console.log('🔍 Buscando usuarios sin obras asignadas...');
    
    // 1. Obtener todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nombre, rol');
    
    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError);
      return;
    }
    
    // 2. Obtener todas las asignaciones existentes
    const { data: userObras, error: userObrasError } = await supabase
      .from('user_obras')
      .select('user_id');
    
    if (userObrasError) {
      console.error('❌ Error al obtener user_obras:', userObrasError);
      return;
    }
    
    // 3. Obtener la primera obra disponible
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('id, nombre')
      .limit(1);
    
    if (obrasError || !obras || obras.length === 0) {
      console.error('❌ No hay obras disponibles');
      return;
    }
    
    const obra = obras[0];
    console.log(`🏗️ Obra disponible: ${obra.nombre} (${obra.id})`);
    
    // 4. Encontrar usuarios sin obras
    const assignedUserIds = new Set(userObras?.map(uo => uo.user_id) || []);
    const usersWithoutObras = users?.filter(user => !assignedUserIds.has(user.id)) || [];
    
    console.log(`👥 Usuarios sin obras: ${usersWithoutObras.length}`);
    
    // 5. Asignar obra a cada usuario sin obra
    for (const user of usersWithoutObras) {
      console.log(`🔄 Asignando obra a: ${user.email} (${user.nombre})`);
      
      const { error: assignError } = await supabase
        .from('user_obras')
        .insert({
          user_id: user.id,
          obra_id: obra.id,
          rol_obra: user.rol || 'logistica',
          assigned_at: new Date().toISOString()
        });
      
      if (assignError) {
        console.error(`❌ Error asignando obra a ${user.email}:`, assignError);
      } else {
        console.log(`✅ Obra asignada exitosamente a ${user.email}`);
      }
    }
    
    // 6. Verificar resultado final
    console.log('\n🔍 Verificación final...');
    const { data: finalUserObras } = await supabase
      .from('user_obras')
      .select('*');
    
    console.log(`📊 Total de asignaciones después: ${finalUserObras?.length || 0}`);
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

// Ejecutar la asignación
assignMissingObra();