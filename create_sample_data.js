const { createClient } = require('@supabase/supabase-js');
const { environment } = require('./src/environments/environment.ts');

// Configurar cliente de Supabase
const supabase = createClient(
  environment.supabase.url,
  environment.supabase.anonKey
);

async function createSampleData() {
  try {
    console.log('Creando datos de ejemplo...');
    
    // Crear obras de ejemplo
    const obras = [
      {
        nombre: 'Construcción Edificio Central',
        descripcion: 'Construcción de edificio de oficinas de 10 pisos',
        ubicacion: 'Av. Principal 123, Ciudad',
        estado: 'activa',
        fecha_inicio: '2024-01-15',
        fecha_fin_estimada: '2024-12-15'
      },
      {
        nombre: 'Remodelación Centro Comercial',
        descripcion: 'Remodelación completa del centro comercial Plaza Norte',
        ubicacion: 'Centro Comercial Plaza Norte',
        estado: 'planificacion',
        fecha_inicio: '2024-03-01',
        fecha_fin_estimada: '2024-08-30'
      },
      {
        nombre: 'Construcción Puente Vehicular',
        descripcion: 'Construcción de puente vehicular sobre río principal',
        ubicacion: 'Río Principal, Km 45',
        estado: 'finalizada',
        fecha_inicio: '2023-06-01',
        fecha_fin_estimada: '2024-01-31'
      }
    ];

    const { data, error } = await supabase
      .from('obras')
      .insert(obras)
      .select();

    if (error) {
      console.error('Error creando obras:', error);
      return;
    }

    console.log('Obras creadas exitosamente:', data.length);
    console.log('Datos creados:', data);

    // Verificar que se crearon correctamente
    const { data: allObras, error: selectError } = await supabase
      .from('obras')
      .select('*');

    if (selectError) {
      console.error('Error consultando obras:', selectError);
      return;
    }

    console.log('Total de obras en la base de datos:', allObras.length);
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

createSampleData();