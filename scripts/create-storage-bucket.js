/**
 * Script para crear el bucket de evidencia fotográfica en Supabase Storage
 * Ejecutar con: node scripts/create-storage-bucket.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('🔄 Verificando buckets existentes...');
    
    // Listar buckets existentes
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listando buckets:', listError);
      return;
    }
    
    console.log('📋 Buckets existentes:', buckets?.map(b => b.name) || []);
    
    // Verificar si el bucket ya existe
    const bucketExists = buckets?.some(bucket => bucket.name === 'evidencia-fotografica');
    
    if (bucketExists) {
      console.log('✅ El bucket "evidencia-fotografica" ya existe');
      return;
    }
    
    console.log('📁 Creando bucket "evidencia-fotografica"...');
    
    // Crear el bucket
    const { data, error } = await supabase.storage.createBucket('evidencia-fotografica', {
      public: false,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error('❌ Error creando bucket:', error);
      return;
    }
    
    console.log('✅ Bucket "evidencia-fotografica" creado exitosamente');
    console.log('📊 Datos del bucket:', data);
    
    // Verificar que el bucket se creó correctamente
    const { data: updatedBuckets } = await supabase.storage.listBuckets();
    console.log('📋 Buckets después de la creación:', updatedBuckets?.map(b => b.name) || []);
    
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar el script
createStorageBucket().then(() => {
  console.log('🏁 Script completado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});