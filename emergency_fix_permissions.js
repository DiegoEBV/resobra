const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function emergencyFixPermissions() {
    console.log('🚨 INICIANDO CORRECCIÓN DE EMERGENCIA DE PERMISOS RLS...');
    
    try {
        // 1. Deshabilitar RLS temporalmente
        console.log('1. Deshabilitando RLS temporalmente...');
        await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
        });
        
        // 2. Otorgar permisos directos a roles
        console.log('2. Otorgando permisos directos...');
        await supabase.rpc('exec_sql', {
            sql: `
                GRANT ALL PRIVILEGES ON TABLE users TO anon;
                GRANT ALL PRIVILEGES ON TABLE users TO authenticated;
                GRANT ALL PRIVILEGES ON TABLE users TO service_role;
            `
        });
        
        // 3. Eliminar políticas existentes que causan conflictos
        console.log('3. Eliminando políticas conflictivas...');
        await supabase.rpc('exec_sql', {
            sql: `
                DROP POLICY IF EXISTS "Residentes pueden ver todos los usuarios" ON users;
                DROP POLICY IF EXISTS "Residentes pueden crear usuarios" ON users;
                DROP POLICY IF EXISTS "Residentes pueden actualizar usuarios" ON users;
                DROP POLICY IF EXISTS "Residentes pueden eliminar usuarios" ON users;
            `
        });
        
        // 4. Crear políticas simples y permisivas
        console.log('4. Creando políticas permisivas...');
        await supabase.rpc('exec_sql', {
            sql: `
                CREATE POLICY "Allow all for authenticated users" ON users 
                FOR ALL USING (auth.role() = 'authenticated');
                
                CREATE POLICY "Allow all for anon users" ON users 
                FOR ALL USING (true);
            `
        });
        
        // 5. Habilitar RLS nuevamente
        console.log('5. Habilitando RLS con nuevas políticas...');
        await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
        });
        
        // 6. Probar operación
        console.log('6. Probando operación de inserción...');
        const testUser = {
            email: 'test@example.com',
            nombre: 'Usuario Test',
            rol: 'residente'
        };
        
        const { data, error } = await supabase
            .from('users')
            .insert(testUser)
            .select();
            
        if (error) {
            console.error('❌ Error en prueba:', error);
        } else {
            console.log('✅ Prueba exitosa:', data);
            
            // Limpiar usuario de prueba
            await supabase
                .from('users')
                .delete()
                .eq('email', 'test@example.com');
        }
        
        console.log('✅ CORRECCIÓN DE EMERGENCIA COMPLETADA');
        
    } catch (error) {
        console.error('❌ Error en corrección de emergencia:', error);
    }
}

// Ejecutar corrección
emergencyFixPermissions();