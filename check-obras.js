const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDA2NTAsImV4cCI6MjA3MTQ3NjY1MH0.qQU8nSWX-6r89n_-OWHfPcYOHS1oxDcPOXXGuS0LxbY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkObras() {
  try {
    console.log('Verificando obras en la base de datos...');
    
    // Obtener todas las obras sin filtro
    const { data: todasObras, error: errorTodas } = await supabase
      .from('obras')
      .select('id, nombre, descripcion, estado')
      .order('nombre');
    
    if (errorTodas) {
      console.error('Error al obtener todas las obras:', errorTodas);
      return;
    }
    
    console.log('=== TODAS LAS OBRAS ===');
    console.log('Total de obras:', todasObras?.length || 0);
    if (todasObras && todasObras.length > 0) {
      todasObras.forEach(obra => {
        console.log(`- ID: ${obra.id}, Nombre: ${obra.nombre}, Estado: ${obra.estado}`);
      });
    } else {
      console.log('No se encontraron obras en la base de datos');
    }
    
    // Obtener solo obras activas
    const { data: obrasActivas, error: errorActivas } = await supabase
      .from('obras')
      .select('id, nombre, descripcion, estado')
      .eq('estado', 'activa')
      .order('nombre');
    
    console.log('\n=== OBRAS ACTIVAS ===');
    console.log('Total de obras activas:', obrasActivas?.length || 0);
    if (obrasActivas && obrasActivas.length > 0) {
      obrasActivas.forEach(obra => {
        console.log(`- ID: ${obra.id}, Nombre: ${obra.nombre}`);
      });
    } else {
      console.log('No se encontraron obras con estado "activa"');
    }
    
    // Verificar estados únicos
    if (todasObras && todasObras.length > 0) {
      const estadosUnicos = [...new Set(todasObras.map(obra => obra.estado))];
      console.log('\n=== ESTADOS ENCONTRADOS ===');
      estadosUnicos.forEach(estado => {
        const count = todasObras.filter(obra => obra.estado === estado).length;
        console.log(`- ${estado}: ${count} obra(s)`);
      });
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkObras();