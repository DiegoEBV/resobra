// Script de diagnóstico para errores de Storage en evidencia fotográfica
// Ejecutar en la consola del navegador cuando ocurran los errores

console.log('🔧 INICIANDO DIAGNÓSTICO DE ERRORES DE STORAGE');

// Función para diagnosticar problemas de autenticación y Storage
async function diagnoseStorageErrors() {
  try {
    console.log('\n=== DIAGNÓSTICO DE AUTENTICACIÓN ===');
    
    // Verificar estado de autenticación
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    console.log('👤 Usuario actual:', user);
    console.log('❌ Error de auth:', authError);
    
    if (!user) {
      console.error('🚫 PROBLEMA: Usuario no autenticado');
      return;
    }
    
    console.log('\n=== DIAGNÓSTICO DE STORAGE ===');
    
    // Verificar bucket existe
    const { data: buckets, error: bucketsError } = await window.supabase.storage.listBuckets();
    console.log('🪣 Buckets disponibles:', buckets);
    console.log('❌ Error buckets:', bucketsError);
    
    const evidenciaBucket = buckets?.find(b => b.id === 'evidencia-fotografica');
    if (!evidenciaBucket) {
      console.error('🚫 PROBLEMA: Bucket evidencia-fotografica no encontrado');
      return;
    }
    
    console.log('✅ Bucket evidencia-fotografica encontrado:', evidenciaBucket);
    
    console.log('\n=== PRUEBA DE SUBIDA DE ARCHIVO ===');
    
    // Crear archivo de prueba
    const testFile = new File(['test content'], 'test-evidencia.txt', { type: 'text/plain' });
    const testPath = `evidencias/test_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.txt`;
    
    console.log('📁 Intentando subir archivo de prueba:', testPath);
    
    // Intentar subir archivo
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('evidencia-fotografica')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    console.log('📤 Resultado de subida:', uploadData);
    console.log('❌ Error de subida:', uploadError);
    
    if (uploadError) {
      console.error('🚫 PROBLEMA EN SUBIDA:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error
      });
      
      // Analizar tipos de error comunes
      if (uploadError.message?.includes('not authenticated')) {
        console.error('🔐 PROBLEMA: Error de autenticación en Storage');
      } else if (uploadError.message?.includes('permission')) {
        console.error('🔒 PROBLEMA: Error de permisos en Storage');
      } else if (uploadError.message?.includes('bucket')) {
        console.error('🪣 PROBLEMA: Error de configuración del bucket');
      }
      
      return;
    }
    
    console.log('✅ Archivo subido exitosamente');
    
    console.log('\n=== PRUEBA DE URL PÚBLICA ===');
    
    // Obtener URL pública
    const { data: urlData } = window.supabase.storage
      .from('evidencia-fotografica')
      .getPublicUrl(testPath);
    
    console.log('🔗 URL pública:', urlData.publicUrl);
    
    console.log('\n=== PRUEBA DE INSERCIÓN EN BD ===');
    
    // Probar inserción en base de datos
    const evidenciaData = {
      actividad_id: '550e8400-e29b-41d4-a716-446655440001', // ID de prueba
      url_imagen: urlData.publicUrl,
      descripcion: 'Prueba de diagnóstico',
      subido_por: user.id,
      nombre_archivo: testFile.name,
      tamaño_archivo: testFile.size,
      tipo_archivo: testFile.type
    };
    
    console.log('💾 Intentando insertar en BD:', evidenciaData);
    
    const { data: evidencia, error: dbError } = await window.supabase
      .from('evidencia_fotografica')
      .insert(evidenciaData)
      .select()
      .single();
    
    console.log('📊 Resultado de inserción:', evidencia);
    console.log('❌ Error de BD:', dbError);
    
    if (dbError) {
      console.error('🚫 PROBLEMA EN BD:', {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      
      // Analizar errores de BD comunes
      if (dbError.code === '42501') {
        console.error('🔒 PROBLEMA: Error de permisos RLS en tabla evidencia_fotografica');
      } else if (dbError.code === '23503') {
        console.error('🔗 PROBLEMA: Violación de clave foránea (actividad_id no existe)');
      }
    } else {
      console.log('✅ Evidencia guardada exitosamente en BD');
      
      // Limpiar archivo de prueba
      console.log('🧹 Limpiando archivo de prueba...');
      await window.supabase.storage
        .from('evidencia-fotografica')
        .remove([testPath]);
      
      // Limpiar registro de BD
      await window.supabase
        .from('evidencia_fotografica')
        .delete()
        .eq('id', evidencia.id);
      
      console.log('✅ Limpieza completada');
    }
    
    console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
    
  } catch (error) {
    console.error('💥 ERROR CRÍTICO EN DIAGNÓSTICO:', error);
  }
}

// Función para verificar permisos específicos
async function checkStoragePermissions() {
  console.log('\n=== VERIFICACIÓN DE PERMISOS DE STORAGE ===');
  
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('🚫 Usuario no autenticado');
      return;
    }
    
    console.log('👤 Usuario ID:', user.id);
    console.log('📧 Email:', user.email);
    console.log('🏷️ Role:', user.role);
    
    // Verificar si puede listar archivos
    const { data: files, error: listError } = await window.supabase.storage
      .from('evidencia-fotografica')
      .list('evidencias', {
        limit: 1
      });
    
    console.log('📂 Puede listar archivos:', !listError);
    console.log('❌ Error al listar:', listError);
    
  } catch (error) {
    console.error('💥 Error verificando permisos:', error);
  }
}

// Ejecutar diagnóstico automáticamente
diagnoseStorageErrors();

// Hacer funciones disponibles globalmente
window.diagnoseStorageErrors = diagnoseStorageErrors;
window.checkStoragePermissions = checkStoragePermissions;

console.log('\n📋 Funciones disponibles:');
console.log('- diagnoseStorageErrors(): Ejecuta diagnóstico completo');
console.log('- checkStoragePermissions(): Verifica permisos de Storage');