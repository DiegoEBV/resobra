// Script de prueba para verificar inserción en evidencia_fotografica
// Ejecutar en la consola del navegador después de autenticarse

console.log('🧪 INICIANDO PRUEBA DE INSERCIÓN EN BASE DE DATOS');

// Función para probar inserción directa en la tabla
async function testDatabaseInsert() {
  console.log('📋 PRUEBA DE INSERCIÓN EN EVIDENCIA_FOTOGRAFICA');
  console.log('==============================================');
  
  // Obtener el cliente de Supabase
  const component = window.ng?.getComponent?.(document.querySelector('app-detalle-actividad'));
  const supabaseClient = component?.evidenciaService?.supabaseService?.client;
  
  if (!supabaseClient) {
    console.error('❌ No se pudo obtener el cliente de Supabase');
    return;
  }
  
  // Verificar autenticación
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user) {
    console.error('❌ Usuario no autenticado:', authError);
    return;
  }
  
  console.log('✅ Usuario autenticado:', user.email);
  
  // Obtener actividad ID actual
  const actividadId = component?.actividadId;
  if (!actividadId) {
    console.error('❌ No hay actividad ID disponible');
    return;
  }
  
  console.log('✅ Actividad ID:', actividadId);
  
  // Datos de prueba para insertar
  const testData = {
    actividad_id: actividadId,
    url_imagen: 'https://example.com/test-image.jpg',
    descripcion: 'Evidencia de prueba - ' + new Date().toISOString(),
    subido_por: user.id,
    nombre_archivo: 'test-image.jpg',
    tamaño_archivo: 12345,
    tipo_archivo: 'image/jpeg'
  };
  
  console.log('📝 Datos de prueba:', testData);
  
  try {
    // Intentar insertar
    console.log('🚀 Insertando registro de prueba...');
    const { data, error } = await supabaseClient
      .from('evidencia_fotografica')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ ERROR EN INSERCIÓN:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return;
    }
    
    console.log('✅ INSERCIÓN EXITOSA:', data);
    
    // Verificar que se puede leer el registro insertado
    console.log('🔍 Verificando lectura del registro...');
    const { data: readData, error: readError } = await supabaseClient
      .from('evidencia_fotografica')
      .select('*')
      .eq('id', data.id)
      .single();
    
    if (readError) {
      console.error('❌ ERROR LEYENDO REGISTRO:', readError);
    } else {
      console.log('✅ LECTURA EXITOSA:', readData);
    }
    
    // Limpiar - eliminar el registro de prueba
    console.log('🧹 Limpiando registro de prueba...');
    const { error: deleteError } = await supabaseClient
      .from('evidencia_fotografica')
      .delete()
      .eq('id', data.id);
    
    if (deleteError) {
      console.error('❌ ERROR ELIMINANDO REGISTRO DE PRUEBA:', deleteError);
    } else {
      console.log('✅ Registro de prueba eliminado exitosamente');
    }
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO EN PRUEBA:', error);
  }
}

// Función para verificar permisos de la tabla
async function checkTablePermissions() {
  console.log('🔐 VERIFICANDO PERMISOS DE TABLA');
  console.log('================================');
  
  const component = window.ng?.getComponent?.(document.querySelector('app-detalle-actividad'));
  const supabaseClient = component?.evidenciaService?.supabaseService?.client;
  
  if (!supabaseClient) {
    console.error('❌ No se pudo obtener el cliente de Supabase');
    return;
  }
  
  try {
    // Intentar una consulta simple
    const { data, error } = await supabaseClient
      .from('evidencia_fotografica')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ ERROR DE PERMISOS:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ PERMISOS OK - Registros en tabla:', data);
    }
  } catch (error) {
    console.error('💥 ERROR VERIFICANDO PERMISOS:', error);
  }
}

// Función para probar el flujo completo de evidencia
async function testCompleteFlow() {
  console.log('🔄 PROBANDO FLUJO COMPLETO DE EVIDENCIA');
  console.log('======================================');
  
  await checkTablePermissions();
  await testDatabaseInsert();
  
  console.log('\n🎯 PRUEBAS COMPLETADAS');
  console.log('Revisa los logs anteriores para identificar problemas');
}

// Ejecutar verificación de permisos automáticamente
checkTablePermissions();

console.log('\n🎯 COMANDOS DISPONIBLES:');
console.log('- checkTablePermissions(): Verificar permisos de tabla');
console.log('- testDatabaseInsert(): Probar inserción directa');
console.log('- testCompleteFlow(): Ejecutar todas las pruebas');
console.log('\n💡 Copia y pega estos comandos en la consola para ejecutarlos');