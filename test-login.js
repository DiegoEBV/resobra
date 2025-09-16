// Script simple para probar login en la consola del navegador
function testLogin() {
  console.log('🧪 Iniciando prueba de login...');
  
  // Obtener el injector de Angular desde el elemento raíz
  const appElement = document.querySelector('app-root');
  if (!appElement) {
    console.error('❌ No se encontró el elemento app-root');
    return;
  }
  
  const injector = ng.getInjector(appElement);
  if (!injector) {
    console.error('❌ No se pudo obtener el injector de Angular');
    return;
  }
  
  // Obtener AuthService
  const authService = injector.get('AuthService');
  if (!authService) {
    console.error('❌ No se pudo obtener AuthService');
    return;
  }
  
  console.log('✅ AuthService obtenido:', authService);
  
  // Ejecutar testLogin
  authService.testLogin();
  
  // Esperar un momento para que se actualice el estado
  setTimeout(() => {
    console.log('🔍 Verificando estado después del login...');
    
    // Verificar estado de autenticación
    authService.isAuthenticated$.subscribe(isAuth => {
      console.log('🔐 Estado de autenticación:', isAuth);
    });
    
    // Verificar usuario actual
    authService.currentUser$.subscribe(user => {
      console.log('👤 Usuario actual:', user);
    });
    
    // Verificar perfil actual
    authService.currentProfile$.subscribe(profile => {
      console.log('📋 Perfil actual:', profile);
    });
    
    // Verificar si aparece el menú lateral
    const sidebar = document.querySelector('.sidebar, app-sidebar, [class*="sidebar"]');
    console.log('📱 Menú lateral encontrado:', !!sidebar);
    if (sidebar) {
      console.log('📱 Elemento del menú:', sidebar);
      console.log('📱 Visible:', sidebar.offsetWidth > 0 && sidebar.offsetHeight > 0);
    } else {
      console.log('🔍 Buscando otros elementos de menú...');
      const allMenus = document.querySelectorAll('[class*="menu"], [class*="nav"], [class*="side"]');
      console.log('🔍 Elementos encontrados:', allMenus);
    }
    
    // Verificar ruta actual
    const router = injector.get('Router');
    if (router) {
      console.log('🛣️ Ruta actual:', router.url);
      
      // Si no estamos en dashboard, navegar
      if (router.url === '/login') {
        console.log('🚀 Navegando al dashboard...');
        router.navigate(['/dashboard']);
      }
    }
  }, 1000);
}

// Ejecutar la función
testLogin();