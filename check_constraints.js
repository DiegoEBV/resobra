const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  try {
    console.log('🔍 Consultando restricciones CHECK en la tabla kpis...');
    
    const { data, error } = await supabase.rpc('exec', {
      query: `
        SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.kpis'::regclass 
        AND contype = 'c'
        ORDER BY conname;
      `
    });
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log('\n📋 Restricciones CHECK encontradas:');
    console.log('=' .repeat(50));
    
    if (data && data.length > 0) {
      data.forEach((constraint, index) => {
        console.log(`\n${index + 1}. ${constraint.constraint_name}`);
        console.log(`   Definición: ${constraint.definition}`);
      });
    } else {
      console.log('✅ No se encontraron restricciones CHECK en la tabla kpis');
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando consulta:', error);
  }
}

checkConstraints();