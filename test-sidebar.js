// Script para verificar la visibilidad del menú lateral
console.log('🔍 Verificando visibilidad del menú lateral...');

// Verificar que el sidebar existe y es visible
const sidebar = document.querySelector('.sidebar');
if (sidebar) {
  console.log('✅ Sidebar encontrado');
  console.log('📏 Dimensiones del sidebar:', {
    width: sidebar.offsetWidth,
    height: sidebar.offsetHeight,
    visible: sidebar.offsetWidth > 0 && sidebar.offsetHeight > 0
  });
  
  // Verificar elementos del menú
  const navItems = sidebar.querySelectorAll('.nav-item');
  console.log('📋 Elementos de navegación encontrados:', navItems.length);
  
  navItems.forEach((item, index) => {
    const link = item.querySelector('span');
    const icon = item.querySelector('mat-icon');
    console.log(`📌 Item ${index + 1}: ${link?.textContent} (${icon?.textContent})`);
  });
  
  // Verificar header del sidebar
  const header = sidebar.querySelector('.sidebar-header');
  if (header) {
    console.log('✅ Header del sidebar visible');
  }
  
  // Verificar footer del sidebar
  const footer = sidebar.querySelector('.sidebar-footer');
  if (footer) {
    console.log('✅ Footer del sidebar visible');
    const userName = footer.querySelector('.user-name');
    if (userName) {
      console.log('👤 Usuario mostrado:', userName.textContent);
    }
  }
  
} else {
  console.log('❌ Sidebar no encontrado');
  
  // Buscar elementos alternativos
  const authLayout = document.querySelector('.authenticated-layout');
  console.log('🔍 Layout autenticado:', !!authLayout);
  
  if (authLayout) {
    console.log('📱 Contenido del layout autenticado:', authLayout.innerHTML.substring(0, 200));
  }
}

// Verificar estado de autenticación en el DOM
const appContainer = document.querySelector('.app-container');
if (appContainer) {
  const isAuthVisible = appContainer.querySelector('.authenticated-layout');
  const isUnauthVisible = appContainer.querySelector('.unauthenticated-layout');
  
  console.log('🔐 Estado visual de autenticación:', {
    authenticated: !!isAuthVisible && isAuthVisible.style.display !== 'none',
    unauthenticated: !!isUnauthVisible && isUnauthVisible.style.display !== 'none'
  });
}

console.log('✅ Verificación del sidebar completada');