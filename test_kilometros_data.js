// Script de prueba para verificar datos kilométricos
// Ejecutar en la consola del navegador cuando esté en la página del mapa

console.log('🔍 Iniciando verificación de datos kilométricos...');

// Verificar si Angular está disponible
if (typeof ng !== 'undefined') {
  console.log('✅ Angular detectado');
  
  // Obtener referencia al componente del mapa
  const mapComponent = ng.getComponent(document.querySelector('app-mapa'));
  
  if (mapComponent) {
    console.log('✅ Componente mapa encontrado');
    console.log('📊 Frentes cargados:', mapComponent.frentes?.length || 0);
    console.log('📏 Kilómetros cargados:', mapComponent.kilometros?.length || 0);
    console.log('🗺️ Vista kilométrica activa:', mapComponent.showKilometricView);
    
    // Mostrar algunos kilómetros de ejemplo
    if (mapComponent.kilometros && mapComponent.kilometros.length > 0) {
      console.log('📋 Primeros 5 kilómetros:');
      mapComponent.kilometros.slice(0, 5).forEach((km, index) => {
        console.log(`  ${index + 1}. KM ${km.kilometro} - Estado: ${km.estado} - Color: ${km.color} - Progreso: ${km.progreso_porcentaje}%`);
      });
    }
    
    // Verificar configuración de estados
    if (mapComponent.estadosConfig && mapComponent.estadosConfig.length > 0) {
      console.log('⚙️ Configuración de estados:');
      mapComponent.estadosConfig.forEach(config => {
        console.log(`  - ${config.estado_nombre}: ${config.color_hex} (${config.umbral_minimo}%-${config.umbral_maximo}%)`);
      });
    }
    
    // Función para activar vista kilométrica si no está activa
    if (!mapComponent.showKilometricView) {
      console.log('🔄 Activando vista kilométrica...');
      mapComponent.toggleKilometricView();
    } else {
      console.log('✅ Vista kilométrica ya está activa');
    }
    
  } else {
    console.log('❌ No se pudo encontrar el componente del mapa');
  }
} else {
  console.log('❌ Angular no está disponible. Asegúrate de estar en modo desarrollo.');
}

console.log('🏁 Verificación completada');