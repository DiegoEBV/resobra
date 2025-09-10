// Script temporal para limpiar el almacenamiento del navegador
console.log('🧹 Limpiando almacenamiento del navegador...');

// Limpiar localStorage
if (typeof localStorage !== 'undefined') {
  const keys = Object.keys(localStorage);
  console.log('🔍 Claves en localStorage:', keys);
  
  // Limpiar específicamente las claves de Supabase
  keys.forEach(key => {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      console.log('🗑️ Eliminando clave:', key);
      localStorage.removeItem(key);
    }
  });
}

// Limpiar sessionStorage
if (typeof sessionStorage !== 'undefined') {
  const keys = Object.keys(sessionStorage);
  console.log('🔍 Claves en sessionStorage:', keys);
  
  keys.forEach(key => {
    if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
      console.log('🗑️ Eliminando clave de session:', key);
      sessionStorage.removeItem(key);
    }
  });
}

console.log('✅ Limpieza completada. Por favor, rec