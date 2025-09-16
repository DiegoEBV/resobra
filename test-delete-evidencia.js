// Script de prueba para diagnosticar problemas de eliminación de evidencia fotográfica
// Ejecutar en la consola del navegador

console.log('🔧 INICIANDO DIAGNÓSTICO DE ELIMINACIÓN DE EVIDENCIA FOTOGRÁFICA');

// Función para probar eliminación de evidencia
async function testDeleteEvidencia() {
  try {
    console.log('📋 1. Obteniendo lista de evidencias...');
    
    // Obtener evidencias existentes
    const { data: evidencias, error: selectError } = await window.supabase
      .from('evidencia_fotografica')
      .select('*')
      .limit(5);
    
    if (selectError) {
      console.error('❌ Error obteniendo evidencias:', selectError);
      return;
    }
    
    console.log('📊 Evidencias encontradas:', evidencias?.length || 0);
    
    if (!evidencias || evidencias.length === 0) {
      console.log('⚠️ No hay evidencias para probar eliminación');
      return;
    }
    
    // Tomar la primera evidencia para prueba
    const evidenciaTest = evidencias[0];
    console.log('🎯 Evidencia seleccionada para prueba:', {
      id: evidenciaTest.id,
      url_imagen: evidenciaTest.url_imagen,
      subido_por: evidenciaTest.subido_por
    });
    
    // Verificar usuario actual
    const { data: { user }, error: userError } = await window.supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Error obteniendo usuario actual:', userError);
      return;
    }
    
    console.log('👤 Usuario actual:', user.id);
    console.log('🔍 ¿Es el propietario?', evidenciaTest.subido_por === user.id);
    
    // Extraer path del archivo de la URL
    const url = new URL(evidenciaTest.url_imagen);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const folderName = pathParts[pathParts.length - 2];
    const filePath = `${folderName}/${fileName}`;
    
    console.log('📁 Path del archivo:', filePath);
    
    // Probar eliminación del archivo en Storage
    console.log('🗑️ 2. Probando eliminación del archivo en Storage...');
    
    const { data: storageData, error: storageError } = await window.supabase.storage
      .from('evidencia-fotografica')
      .remove([filePath]);
    
    if (storageError) {
      console.error('❌ Error eliminando archivo del storage:', storageError);
    } else {
      console.log('✅ Archivo eliminado del storage exitosamente:', storageData);
    }
    
    // Probar eliminación del registro en BD
    console.log('🗑️ 3. Probando eliminación del registro en BD...');
    
    const { data: dbData, error: dbError } = await window.supabase
      .from('evidencia_fotografica')
      .delete()
      .eq('id', evidenciaTest.id);
    
    if (dbError) {
      console.error('❌ Error eliminando registro de BD:', dbError);
    } else {
      console.log('✅ Registro eliminado de BD exitosamente:', dbData);
    }
    
    // Verificar políticas RLS
    console.log('🔒 4. Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await window.supabase
      .rpc('get_policies', { table_name: 'evidencia_fotografica' })
      .catch(() => {
        console.log('⚠️ No se pudo obtener información de políticas (función no disponible)');
        return { data: null, error: null };
      });
    
    if (policies) {
      console.log('📋 Políticas RLS:', policies);
    }
    
    // Verificar permisos de Storage
    console.log('🔒 5. Verificando permisos de Storage...');
    
    const { data: buckets, error: bucketsError } = await window.supabase.storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error obteniendo buckets:', bucketsError);
    } else {
      const evidenciaBucket = buckets.find(b => b.id === 'evidencia-fotografica');
      console.log('📦 Bucket evidencia-fotografica:', evidenciaBucket);
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL EN PRUEBA:', error);
  }
}

// Función para probar el servicio Angular
async function testAngularService() {
  try {
    console.log('🅰️ 6. Probando servicio Angular...');
    
    // Verificar si el servicio está disponible
    if (typeof ng === 'undefined') {
      console.log('⚠️ Angular DevTools no disponible');
      return;
    }
    
    // Obtener el servicio de evidencia fotográfica
    const appRef = ng.getComponent(document.querySelector('app-root'));
    if (!appRef) {
      console.log('⚠️ No se pudo obtener referencia de la aplicación');
      return;
    }
    
    console.log('✅ Servicio Angular accesible');
    
  } catch (error) {
    console.error('❌ Error probando servicio Angular:', error);
  }
}

// Ejecutar diagnóstico completo
async function runFullDiagnosis() {
  console.log('🚀 === INICIANDO DIAGNÓSTICO COMPLETO ===');
  
  await testDeleteEvidencia();
  await testAngularService();
  
  console.log('🔧 === FIN DEL DIAGNÓSTICO ===');
}

// Ejecutar automáticamente
runFullDiagnosis();

// Exportar funciones para uso manual
window.testDeleteEvidencia = testDeleteEvidencia;
window.testAngularService = testAngularService;
window.runFullDiagnosis = runFullDiagnosis;

console.log('📝 Funciones disponibles:');
console.log('- testDeleteEvidencia(): Prueba eliminación directa');
console.log('- testAngularService(): Prueba servicio Angular');
console.log('- runFullDiagnosis(): Ejecuta diagnóstico completo');