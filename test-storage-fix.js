// Script para verificar que la configuración de Storage esté funcionando
// Ejecutar en la consola del navegador después de hacer login

console.log('🔧 VERIFICANDO CONFIGURACIÓN DE STORAGE DESPUÉS DEL FIX');
console.log('=======================================================');

// Función para probar la configuración de Storage
async function testStorageConfiguration() {
  try {
    console.log('1. 🔍 Verificando cliente Supabase...');
    
    // Verificar que Supabase esté disponible
    if (!window.supabase) {
      console.error('❌ Cliente Supabase no disponible');
      return;
    }
    
    console.log('✅ Cliente Supabase disponible');
    
    // Verificar autenticación
    console.log('2. 🔐 Verificando autenticación...');
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Usuario no autenticado:', authError);
      return;
    }
    
    console.log('✅ Usuario autenticado:', user.email);
    
    // Verificar bucket
    console.log('3. 🪣 Verificando bucket evidencia-fotografica...');
    const { data: buckets, error: bucketsError } = await window.supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listando buckets:', bucketsError);
      return;
    }
    
    const evidenciaBucket = buckets.find(b => b.name === 'evidencia-fotografica');
    if (!evidenciaBucket) {
      console.error('❌ Bucket evidencia-fotografica no encontrado');
      return;
    }
    
    console.log('✅ Bucket evidencia-fotografica encontrado:', evidenciaBucket);
    
    // Probar subida de archivo de prueba
    console.log('4. 📤 Probando subida de archivo...');
    
    // Crear un archivo de prueba pequeño
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('TEST', 30, 55);
    
    // Convertir a blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const testFile = new File([blob], 'test-storage.png', { type: 'image/png' });
    
    console.log('📁 Archivo de prueba creado:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Intentar subir
    const testPath = `test/${Date.now()}-test.png`;
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('evidencia-fotografica')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ ERROR EN SUBIDA DE PRUEBA:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        details: uploadError
      });
      return;
    }
    
    console.log('✅ SUBIDA DE PRUEBA EXITOSA:', uploadData);
    
    // Obtener URL pública
    const { data: urlData } = window.supabase.storage
      .from('evidencia-fotografica')
      .getPublicUrl(testPath);
    
    console.log('✅ URL pública obtenida:', urlData.publicUrl);
    
    // Limpiar archivo de prueba
    await window.supabase.storage
      .from('evidencia-fotografica')
      .remove([testPath]);
    
    console.log('✅ Archivo de prueba limpiado');
    
    console.log('🎉 TODAS LAS PRUEBAS PASARON - STORAGE CONFIGURADO CORRECTAMENTE');
    
  } catch (error) {
    console.error('💥 ERROR EN PRUEBA DE STORAGE:', error);
  }
}

// Ejecutar prueba
testStorageConfiguration();

// También exportar para uso manual
window.testStorageConfiguration = testStorageConfiguration;

console.log('💡 Prueba ejecutada. Si hay errores, revisa los logs arriba.');
console.log('💡 Para ejecutar manualmente: testStorageConfiguration()');