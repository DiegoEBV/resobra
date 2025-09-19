const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://urecschltmyeemmedov.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyZWNzY2hsdG15ZWVtbWVkb3YiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0NTU5NzI4LCJleHAiOjIwNTAxMzU3Mjh9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserObras() {
  try {
    console.log('=== DIAGNÓSTICO DE TABLA user_obras ===\n');
    
    // 1. Verificar estructura de la tabla
    console.log('1. Verificando estructura de la tabla user_obras...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('user_obras')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error al acceder a user_obras:', tableError.message);
      return;
    } else {
      console.log('✅ Tabla user_obras accesible');
    }
    
    // 2. Verificar registros existentes
    console.log('\n2. Verificando registros existentes...');
    const { data: existingRecords, error: selectError } = await supabase
      .from('user_obras')
      .select('*');
    
    if (selectError) {
      console.error('❌ Error al leer user_obras:', selectError.message);
    } else {
      console.log(`✅ Registros encontrados: ${existingRecords.length}`);
      if (existingRecords.length > 0) {
        console.log('Primeros registros:', existingRecords.slice(0, 3));
      }
    }
    
    // 3. Verificar usuarios existentes
    console.log('\n3. Verificando usuarios existentes...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nombre, rol');
    
    if (usersError) {
      console.error('❌ Error al leer usuarios:', usersError.message);
    } else {
      console.log(`✅ Usuarios encontrados: ${users.length}`);
      console.log('Usuarios:', users.map(u => ({ id: u.id, email: u.email, rol: u.rol })));
    }
    
    // 4. Verificar obras existentes
    console.log('\n4. Verificando obras existentes...');
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('id, nombre, estado');
    
    if (obrasError) {
      console.error('❌ Error al leer obras:', obrasError.message);
    } else {
      console.log(`✅ Obras encontradas: ${obras.length}`);
      console.log('Obras:', obras.map(o => ({ id: o.id, nombre: o.nombre, estado: o.estado })));
    }
    
    // 5. Intentar inserción de prueba
    console.log('\n5. Probando inserción en user_obras...');
    
    if (users.length > 0 && obras.length > 0) {
      const testUserId = users[0].id;
      const testObraId = obras[0].id;
      
      // Verificar si ya existe la asignación
      const { data: existing, error: existingError } = await supabase
        .from('user_obras')
        .select('*')
        .eq('user_id', testUserId)
        .eq('obra_id', testObraId);
      
      if (existingError) {
        console.error('❌ Error al verificar asignación existente:', existingError.message);
      } else if (existing.length > 0) {
        console.log('ℹ️ Ya existe asignación para este usuario y obra');
      } else {
        // Intentar insertar
        const { data: insertResult, error: insertError } = await supabase
          .from('user_obras')
          .insert({
            user_id: testUserId,
            obra_id: testObraId,
            rol_obra: 'residente',
            assigned_at: new Date().toISOString()
          })
          .select();
        
        if (insertError) {
          console.error('❌ Error al insertar en user_obras:', insertError.message);
          console.error('Detalles del error:', insertError);
        } else {
          console.log('✅ Inserción exitosa:', insertResult);
          
          // Limpiar el registro de prueba
          await supabase
            .from('user_obras')
            .delete()
            .eq('user_id', testUserId)
            .eq('obra_id', testObraId);
          console.log('🧹 Registro de prueba eliminado');
        }
      }
    } else {
      console.log('⚠️ No hay usuarios u obras para probar la inserción');
    }
    
    // 6. Verificar políticas RLS
    console.log('\n6. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'user_obras' })
      .catch(() => null);
    
    if (policies) {
      console.log('✅ Políticas RLS encontradas:', policies.length);
    } else {
      console.log('⚠️ No se pudieron obtener las políticas RLS');
    }
    
    console.log('\n=== FIN DEL DIAGNÓSTICO ===');
    
  } catch (error) {
    console.error('❌ Error general en el diagnóstico:', error);
  }
}

debugUserObras();