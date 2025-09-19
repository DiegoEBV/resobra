const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDY1MCwiZXhwIjoyMDcxNDc2NjUwfQ.RBM4O4shM8fFPyCfj3dJ1Ic4KsCAhTAJ2JrJd-MZTno';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkKPIsPolicies() {
    console.log('🔍 Verificando políticas RLS para la tabla kpis...');
    console.log('=' .repeat(50));
    
    try {
        // Verificar políticas RLS
        console.log('\n1️⃣ Consultando políticas RLS de la tabla kpis...');
        let policies = null;
        let policiesError = null;
        
        try {
            const result = await supabase.rpc('get_table_policies', { table_name: 'kpis' });
            policies = result.data;
            policiesError = result.error;
        } catch (err) {
            console.log('⚠️ RPC get_table_policies no disponible, intentando consulta directa...');
            try {
                const result = await supabase
                    .from('pg_policies')
                    .select('*')
                    .eq('tablename', 'kpis');
                policies = result.data;
                policiesError = result.error;
            } catch (err2) {
                policiesError = err2;
            }
        }
        
        if (policiesError) {
            console.log('⚠️ No se pudieron obtener políticas via RPC, intentando consulta SQL...');
            
            // Consulta SQL directa para obtener políticas
            let sqlPolicies = null;
            let sqlError = null;
            
            try {
                const result = await supabase.rpc('exec_sql', {
                    query: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
                           FROM pg_policies 
                           WHERE tablename = 'kpis';`
                });
                sqlPolicies = result.data;
                sqlError = result.error;
            } catch (err) {
                sqlError = 'RPC no disponible';
            }
            
            if (sqlError || !sqlPolicies) {
                console.log('❌ No se pudieron obtener las políticas RLS');
                console.log('Verificando permisos básicos...');
                
                // Verificar permisos básicos de la tabla
                const { data: tableInfo, error: tableError } = await supabase
                    .from('information_schema.tables')
                    .select('*')
                    .eq('table_name', 'kpis')
                    .eq('table_schema', 'public');
                
                if (tableError) {
                    console.error('❌ Error verificando tabla:', tableError);
                } else {
                    console.log('✅ Tabla kpis encontrada:', tableInfo);
                }
            } else {
                console.log('✅ Políticas RLS encontradas:', sqlPolicies);
            }
        } else {
            console.log('✅ Políticas RLS:', policies);
        }
        
        // Verificar permisos para roles anon y authenticated
        console.log('\n2️⃣ Verificando permisos de roles...');
        let permissions = null;
        let permError = null;
        
        try {
            const result = await supabase.rpc('exec_sql', {
                query: `SELECT grantee, table_name, privilege_type 
                       FROM information_schema.role_table_grants 
                       WHERE table_schema = 'public' 
                       AND table_name = 'kpis' 
                       AND grantee IN ('anon', 'authenticated') 
                       ORDER BY table_name, grantee;`
            });
            permissions = result.data;
            permError = result.error;
        } catch (err) {
            console.log('⚠️ RPC exec_sql no disponible');
            permError = 'No se pudo verificar permisos';
        }
        
        if (permError || !permissions) {
            console.log('⚠️ No se pudieron verificar permisos de roles');
        } else {
            console.log('✅ Permisos de roles:', permissions);
        }
        
        // Probar inserción con token anon
        console.log('\n3️⃣ Probando inserción con token anon...');
        const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDA2NTAsImV4cCI6MjA3MTQ3NjY1MH0.qQU8nSWX-6r89n_-OWHfPcYOHS1oxDcPOXXGuS0LxbY');
        
        const testKPI = {
            fecha: new Date().toISOString().split('T')[0],
            avance_fisico: 50,
            productividad: 75,
            calidad: 80,
            created_by: 'test-user-id'
        };
        
        const { data: insertResult, error: insertError } = await anonClient
            .from('kpis')
            .insert([testKPI])
            .select();
        
        if (insertError) {
            console.log('❌ Error en inserción con anon:', insertError);
        } else {
            console.log('✅ Inserción exitosa con anon:', insertResult);
            
            // Limpiar el registro de prueba
            if (insertResult && insertResult[0]) {
                await supabase
                    .from('kpis')
                    .delete()
                    .eq('id', insertResult[0].id);
                console.log('🧹 Registro de prueba eliminado');
            }
        }
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

checkKPIsPolicies().then(() => {
    console.log('\n✅ Verificación completada');
}).catch(console.error);