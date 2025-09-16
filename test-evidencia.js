// Script de prueba para diagnosticar problemas de evidencia fotográfica
// Ejecutar en la consola del navegador

console.log('🔧 INICIANDO DIAGNÓSTICO DE EVIDENCIA FOTOGRÁFICA');

// Función para probar la subida de evidencias
function testEvidenciaUpload() {
  console.log('📋 DIAGNÓSTICO COMPLETO DE EVIDENCIA FOTOGRÁFICA');
  console.log('================================================');
  
  // 1. Verificar que el servicio esté disponible
  const evidenciaService = window.ng?.getComponent?.(document.querySelector('app-detalle-actividad'))?.evidenciaService;
  console.log('1. Servicio de evidencia:', evidenciaService ? '✅ Disponible' : '❌ No disponible');
  
  // 2. Verificar configuración de Supabase
  const supabaseClient = evidenciaService?.supabaseService?.client;
  console.log('2. Cliente Supabase:', supabaseClient ? '✅ Configurado' : '❌ No configurado');
  
  // 3. Verificar autenticación
  if (supabaseClient) {
    supabaseClient.auth.getUser().then(({ data: { user }, error }) => {
      console.log('3. Usuario autenticado:', user ? `✅ ${user.email}` : '❌ No autenticado');
      if (error) console.error('   Error de autenticación:', error);
    });
  }
  
  // 4. Verificar bucket de storage
  if (supabaseClient) {
    supabaseClient.storage.listBuckets().then(({ data, error }) => {
      console.log('4. Buckets disponibles:', data ? data.map(b => b.name) : 'Error');
      const evidenciaBucket = data?.find(b => b.name === 'evidencia-fotografica');
      console.log('   Bucket evidencia-fotografica:', evidenciaBucket ? '✅ Existe' : '❌ No existe');
      if (error) console.error('   Error listando buckets:', error);
    });
  }
  
  // 5. Verificar tabla evidencia_fotografica
  if (supabaseClient) {
    supabaseClient.from('evidencia_fotografica').select('count', { count: 'exact' }).then(({ count, error }) => {
      console.log('5. Tabla evidencia_fotografica:', error ? '❌ Error' : `✅ Accesible (${count} registros)`);
      if (error) console.error('   Error accediendo tabla:', error);
    });
  }
  
  // 6. Verificar actividad actual
  const component = window.ng?.getComponent?.(document.querySelector('app-detalle-actividad'));
  console.log('6. Actividad ID:', component?.actividadId || 'No disponible');
  console.log('7. Evidencias cargadas:', component?.evidencias?.length || 0);
  
  console.log('================================================');
  console.log('🔍 Para más detalles, revisa los logs anteriores');
}

// Función para simular subida de archivo
function simulateFileUpload() {
  console.log('🧪 SIMULANDO SUBIDA DE ARCHIVO');
  
  // Crear un archivo de prueba (imagen 1x1 pixel)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 1, 1);
  
  canvas.toBlob((blob) => {
    const testFile = new File([blob], 'test-evidencia.png', { type: 'image/png' });
    console.log('📁 Archivo de prueba creado:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    const component = window.ng?.getComponent?.(document.querySelector('app-detalle-actividad'));
    if (component && component.evidenciaService && component.actividadId) {
      console.log('🚀 Iniciando subida de prueba...');
      
      component.evidenciaService.subirEvidencia(testFile, component.actividadId, 'Evidencia de prueba')
        .then(result => {
          console.log('✅ SUBIDA EXITOSA:', result);
        })
        .catch(error => {
          console.error('❌ ERROR EN SUBIDA:', error);
        });
    } else {
      console.error('❌ No se puede realizar la prueba: componente o servicio no disponible');
    }
  }, 'image/png');
}

// Ejecutar diagnóstico automáticamente
testEvidenciaUpload();

console.log('\n🎯 COMANDOS DISPONIBLES:');
console.log('- testEvidenciaUpload(): Ejecutar diagnóstico completo');
console.log('- simulateFileUpload(): Simular subida de archivo de prueba');
console.log('\n💡 Copia y pega estos comandos en la consola para ejecutarlos');