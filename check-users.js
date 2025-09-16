const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  console.log('🔍 Verificando usuarios existentes...');
  
  try {
    // Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error obteniendo usuarios de auth:', authError);
      return;
    }
    
    console.log('\n📊 USUARIOS EN AUTH.USERS:');
    console.log('Total usuarios:', authUsers.users.length);
    
    authUsers.users.forEach((user, index) => {
      console.log(`\n--- Usuario ${index + 1} ---`);
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Creado:', new Date(user.created_at).toLocaleString());
      console.log('Último login:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca');
      console.log('Confirmado:', user.email_confirmed_at ? 'Sí' : 'No');
      
      // Identificar posibles usuarios de prueba
      const isTestUser = 
        user.email?.includes('test') ||
        user.email?.includes('prueba') ||
        user.email?.includes('demo') ||
        user.email?.includes('example') ||
        user.email?.includes('temp');
      
      if (isTestUser) {
        console.log('🚨 POSIBLE USUARIO DE PRUEBA');
      }
    });
    
    // Verificar si existe tabla profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (!profilesError && profiles) {
      console.log('\n📊 USUARIOS EN PUBLIC.PROFILES:');
      console.log('Total perfiles:', profiles.length);
      
      profiles.forEach((profile, index) => {
        console.log(`\n--- Perfil ${index + 1} ---`);
        console.log('ID:', profile.id);
        console.log('Email:', profile.email || 'No especificado');
        console.log('Nombre:', profile.nombre || profile.name || 'No especificado');
        console.log('Rol:', profile.rol || profile.role || 'No especificado');
        
        // Identificar posibles usuarios de prueba
        const isTestProfile = 
          profile.email?.includes('test') ||
          profile.email?.includes('prueba') ||
          profile.nombre?.includes('test') ||
          profile.nombre?.includes('prueba') ||
          profile.name?.includes('test') ||
          profile.name?.includes('prueba');
        
        if (isTestProfile) {
          console.log('🚨 POSIBLE PERFIL DE PRUEBA');
        }
      });
    } else {
      console.log('\n⚠️ No se pudo acceder a la tabla profiles o no existe');
    }
    
    // Verificar otras tablas relacionadas
    const tables = ['evaluaciones', 'evidencias_fotograficas', 'actividades'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('user_id, created_at')
          .limit(5);
        
        if (!error && data) {
          console.log(`\n📊 REGISTROS EN ${table.toUpperCase()}:`);
          console.log('Total registros:', data.length);
          
          const userIds = [...new Set(data.map(item => item.user_id).filter(Boolean))];
          console.log('User IDs únicos:', userIds);
        }
      } catch (err) {
        console.log(`⚠️ No se pudo acceder a la tabla ${table}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkUsers();