import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, combineLatest, of } from 'rxjs';
import { map, timeout, catchError, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    console.log('🛡️ AuthGuard - Verificando autenticación...');
    
    // Forzar actualización del estado de autenticación
    this.authService.forceAuthStateUpdate().catch(e => 
      console.warn('⚠️ Error forzando actualización de estado en AuthGuard:', e)
    );
    
    // Combinar sesión y perfil para una verificación más robusta
    return combineLatest([
      this.authService.currentUser$,
      this.authService.currentProfile$
    ]).pipe(
      filter(([user, profile]) => {
        const hasUser = !!user;
        const hasProfile = !!profile;
        
        console.log('🛡️ AuthGuard - Verificando autenticación:', {
          hasUser,
          hasProfile,
          userEmail: user?.email,
          profileId: profile?.id
        });
        
        // Si no hay usuario, definitivamente no está autenticado
        if (!hasUser) {
          console.log('❌ AuthGuard - No hay usuario, no autenticado');
          return true; // Permitir que pase para manejar la redirección
        }
        
        // Si hay usuario pero no perfil, esperar un poco más
        if (hasUser && !hasProfile) {
          console.log('⏳ AuthGuard - Usuario encontrado, esperando perfil...');
          return false; // Continuar esperando
        }
        
        // Si hay tanto usuario como perfil, está completamente autenticado
        console.log('✅ AuthGuard - Usuario y perfil encontrados, autenticado');
        return true;
      }),
      take(1),
      timeout(15000), // Aumentado a 15 segundos
      map(([user, profile]) => {
        const isAuthenticated = !!user && !!profile;
        
        console.log('🛡️ AuthGuard - Resultado final:', {
          isAuthenticated,
          userEmail: user?.email,
          profileId: profile?.id
        });
        
        if (!isAuthenticated) {
          console.log('❌ Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/login']);
          return false;
        }
        
        console.log('✅ Usuario autenticado, permitiendo acceso');
        return true;
      }),
      catchError(error => {
        console.error('❌ AuthGuard - Error o timeout:', error);
        console.log('❌ Redirigiendo a login por error/timeout');
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}