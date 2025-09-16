// Script de prueba final para verificar la eliminación de evidencia fotográfica
// Ejecutar en la consola del navegador después de navegar a una actividad específica

console.log('🔧 PRUEBA FINAL DE ELIMINACIÓN DE EVIDENCIA FOTOGRÁFICA');

// Función para probar la eliminación completa
async function testFinalDelete() {
  try {
    console.log('📋 1. Verificando evidencias disponibles...');
    
    // Obtener evidencias existentes
    const { data: evidencias, error: selectError } = await window.supabase
      .from('evidencia_fotografica')
      .select('*')
      .limit(3);
    
    if (selectError) {
      console.error('❌ Error obteniendo evidencias:', selectError);
      return;
    }
    
    if (!evidencias || evidencias.length === 0) {
      console.log('ℹ️ No hay evidencias para probar eliminación');
      return;
    }
    
    console.log(`✅ Encontradas ${evidencias.length} evidencias:`);
    evidencias.forEach((ev, index) => {
      console.log(`   ${index + 1}. ID: ${ev.id}, Archivo: ${ev.nombre_archivo}, URL: ${ev.url_imagen}`);
    });
    
    // Seleccionar la primera evidencia para prueba
    const evidenciaTest = evidencias[0];
    console.log(`\n🎯 Probando eliminación de evidencia: ${evidenciaTest.id}`);
    
    // Verificar que el usuario actual puede eliminar esta evidencia
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Usuario no autenticado');
      return;
    }
    
    console.log(`👤 Usuario actual: ${user.id}`);
    console.log(`👤 Propietario evidencia: ${evidenciaTest.subido_por}`);
    
    if (user.id !== evidenciaTest.subido_por) {
      console.warn('⚠️ El usuario actual no es el propietario de esta evidencia');
      console.log('   Esto podría causar un error de permisos');
    }
    
    // Extraer path del archivo para verificación
    console.log('\n📁 2. Analizando path del archivo...');
    const url = new URL(evidenciaTest.url_imagen);
    const pathParts = url.pathname.split('/').filter(part => part.length > 0);
    console.log('   Path parts:', pathParts);
    
    let filePath;
    const bucketIndex = pathParts.findIndex(part => part === 'evidencia-fotografica');
    if (bucketIndex >= 0 && bucketIndex < pathParts.length - 2) {
      const userId = pathParts[bucketIndex + 1];
      const fileName = pathParts[bucketIndex + 2];
      filePath = `${userId}/${fileName}`;
    } else {
      filePath = `${pathParts[pathParts.length - 2]}/${pathParts[pathParts.length - 1]}`;
    }
    
    console.log(`   📁 Path calculado: ${filePath}`);
    
    console.log('\n🎉 ANÁLISIS COMPLETADO - Para eliminar realmente, usar el botón en la UI');
    
  } catch (error) {
    console.error('❌ Error general en prueba:', error);
  }
}

// Función para probar el servicio Angular
function testAngularService() {
  console.log('\n🅰️ PROBANDO SERVICIO ANGULAR...');
  
  try {
    // Obtener el componente actual
    const component = ng?.getComponent?.(document.querySelector('app-detalle-actividad'));
    if (!component) {
      console.log('ℹ️ Componente detalle-actividad no encontrado o Angular DevTools no disponible');
      return;
    }
    
    console.log('✅ Componente encontrado:', component.constructor.name);
    console.log('   Evidencias cargadas:', component.evidencias?.length || 0);
    
    if (component.evidencias && component.evidencias.length > 0) {
      const evidencia = component.evidencias[0];
      console.log('\n🧪 Información de evidencia disponible:');
      console.log('   ID:', evidencia.id);
      console.log('   Nombre:', evidencia.nombre_archivo);
      console.log('   Descripción:', evidencia.descripcion);
      console.log('\nℹ️ Para probar eliminación, usar el botón de eliminar en la UI');
    }
    
  } catch (error) {
    console.error('❌ Error probando servicio Angular:', error);
  }
}

// Ejecutar pruebas
console.log('\n🚀 Iniciando análisis...');
testFinalDelete().then(() => {
  testAngularService();
  console.log('\n✅ Análisis completado');
});

// Exportar funciones para uso manual
window.testFinalDelete = testFinalDelete;
window.testAngularService = testAngularService;