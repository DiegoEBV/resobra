const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPermissions() {
    console.log('🔧 Iniciando corrección de permisos RLS...');
    
    try {
        // 1. Verificar permisos actuales
        console.log('📋 Verificando permisos actuales...');
        const { data: permissions, error: permError } = await supabase
            .rpc('check_table_permissions', { table_name: 'users' });
        
        if (permError) {
            console.log('⚠️ Error al verificar permisos:', permError.message);
        } else {
            console.log('✅ Permisos actuales:', permissions);
        }

        // 2. Otorgar permisos básicos a roles
        console.log('🔑 Otorgando permisos a roles anon y authenticated...');
        
        const grantQueries = [
            'GRANT SELECT ON users TO anon;',
            'GRANT ALL PRIVILEGES ON users TO authenticated;',
            'GRANT USAGE ON SEQUENCE users_id_seq TO authenticated;'
        ];

        for (const query of grantQueries) {
            const { error } = await supabase.rpc('execute_sql', { sql: query });
            if (error) {
                console.log(`❌ Error ejecutando: ${query}`, error.message);
            } else {
                console.log(`✅ Ejecutado: ${query}`);
            }
        }

        // 3. Verificar políticas RLS existentes
        console.log('📝 Verificando políticas RLS...');
        const { data: policies, error: policyError } = await supabase
            .rpc('get_table_policies', { table_name: 'users' });
        
        if (policyError) {
            console.log('⚠️ Error al obtener políticas:', policyError.message);
        } else {
            console.log('📋 Políticas existentes:', policies);
        }

        // 4. Crear/actualizar políticas RLS
        console.log('🛡️ Actualizando políticas RLS...');
        
        const rlsPolicies = [
            {
                name: 'users_select_policy',
                sql: `CREATE POLICY users_select_policy ON users FOR SELECT USING (true);`
            },
            {
                name: 'users_insert_policy', 
                sql: `CREATE POLICY users_insert_policy ON users FOR INSERT WITH CHECK (auth.role() = 'authenticated');`
            },
            {
                name: 'users_update_policy',
                sql: `CREATE POLICY users_update_policy ON users FOR UPDATE USING (auth.role() = 'authenticated');`
            },
            {
                name: 'users_delete_policy',
                sql: `CREATE POLICY users_delete_policy ON users FOR DELETE USING (auth.role() = 'authenticated');`
            }
        ];

        for (const policy of rlsPolicies) {
            // Primero intentar eliminar la política si existe
            const dropSql = `DROP POLICY IF EXISTS ${policy.name} ON users;`;
            await supabase.rpc('execute_sql', { sql: dropSql });
            
            // Luego crear la nueva política
            const { error } = await supabase.rpc('execute_sql', { sql: policy.sql });
            if (error) {
                console.log(`❌ Error creando política ${policy.name}:`, error.message);
            } else {
                console.log(`✅ Política ${policy.name} creada correctamente`);
            }
        }

        // 5. Verificar que RLS esté habilitado
        console.log('🔒 Verificando que RLS esté habilitado...');
        const { error: rlsError } = await supabase.rpc('execute_sql', { 
            sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;' 
        });
        
        if (rlsError) {
            console.log('⚠️ RLS ya estaba habilitado o error:', rlsError.message);
        } else {
            console.log('✅ RLS habilitado en tabla users');
        }

        // 6. Probar operaciones básicas
        console.log('🧪 Probando operaciones básicas...');
        
        // Test SELECT
        const { data: testSelect, error: selectError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
            
        if (selectError) {
            console.log('❌ Error en SELECT:', selectError.message);
        } else {
            console.log('✅ SELECT funciona correctamente');
        }

        console.log('🎉 Corrección de permisos completada!');
        
    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

// Ejecutar la corrección
fixPermissions();