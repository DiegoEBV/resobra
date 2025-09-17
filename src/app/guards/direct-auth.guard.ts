import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { DirectAuthService } from '../services/direct-auth.service';

@Injectable({
  providedIn: 'root'
})
export class DirectAuthGuard implements CanActivate {

  constructor(
    private directAuthService: DirectAuthService, 
    private router: Router
  ) {}

  canActivate(): boolean {
    console.log('🔒 DirectAuthGuard - Verificando autenticación...');
    
    const isAuthenticated = this.directAuthService.isAuthenticated();
    
    if (!isAuthenticated) {
      console.log('❌ DirectAuthGuard - Usuario no autenticado, redirigiendo a login');
      this.router.navigate(['/login']);
      return false;
    }
    
    console.log('✅ DirectAuthGuard - Usuario autenticado, permitiendo acceso');
    return true;
  }
}