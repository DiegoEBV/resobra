const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixjqjqjqjqjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4anFqcWpxanFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzA4NjcsImV4cCI6MjA1Mjk0Njg2N30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    console.log('Verificando obras...');
    const { data: obras, error: obrasError } = await supabase
      .from('obras')
      .select('*');
    
    console.log('Obras:', obras);
    console.log('Obras Error:', obrasError);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();