// Script de verificación para confirmar que el login funciona correctamente
// Ejecutar con: node verify-login-fix.js

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ugecshlhptnyeemmedoy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZWNzaGxocHRueWVlbW1lZG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDA2NTAsImV4cCI6MjA3MTQ3NjY1MH0.qQU8nSWX-6r89n_-OWHfPcYOHS1oxDcPOXXGuS0LxbY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyLoginFix() {
    console.log('🔧 Verificando corrección del login...');
    console.log('=' .repeat(50));
    
    try {
        // 1. Verificar usuarios en la base de datos
        console.log('\n1️⃣ Verificando usuarios en la tabla users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at');
        
        if (usersError) {
            console.error('❌ Error consultando usuarios:', usersError.message);
            return;
        }
        
        console.log(`✅ Usuarios encontrados: ${users.length}`);
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} - ${user.nombre} (${user.rol})`);
        });
        
        // 2. Probar login con usuario residente
        console.log('\n2️⃣ Probando login con usuario residente...');
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: 'RESIDENTE@CVH.COM',
            password: '123456'
        });
        
        if (loginError) {
            console.error('❌ Error en login:', loginError.message);
            return;
        }
        
        if (loginData?.user && loginData?.session) {
            console.log(`✅ Login exitoso! Usuario ID: ${loginData.user.id}`);
            
            // 3. Cargar perfil desde tabla users
            console.log('\n3️⃣ Cargando perfil desde tabla users...');
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', loginData.user.id)
                .single();
            
            if (profileError) {
                console.error('❌ Error cargando perfil:', profileError.message);
                console.error('Detalles:', profileError);
            } else if (profile) {
                console.log('✅ Perfil cargado exitosamente!');
                console.log('📋 Datos del perfil:');
                console.log(`   - ID: ${profile.id}`);
                console.log(`   - Email: ${profile.email}`);
                console.log(`   - Nombre: ${profile.nombre}`);
                console.log(`   - Rol: ${profile.rol}`);
                console.log(`   - Creado: ${profile.created_at}`);
                
                if (profile.rol === 'residente') {
                    console.log('🎉 ¡CORRECCIÓN EXITOSA! El usuario residente se carga correctamente.');
                } else {
                    console.log('⚠️ Advertencia: El rol no es "residente"');
                }
            } else {
                console.log('⚠️ No se encontró perfil para este usuario');
            }
            
            // 4. Cerrar sesión
            await supabase.auth.signOut();
            console.log('\n4️⃣ Sesión cerrada correctamente');
            
        } else {
            console.error('❌ No se recibió token de acceso');
        }
        
    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Verificación completada');
}

// Ejecutar verificación
verifyLoginFix().catch(console.error);