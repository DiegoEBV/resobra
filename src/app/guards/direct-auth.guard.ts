import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { DirectAuthService } from '../services/direct-auth.service';

@Injectable({
  providedIn: 'root'
})
export class DirectAuthGuard implements CanActivate {

  constructor(
    private directAuthService: DirectAuthService, 
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    try {
      const user = this.directAuthService.getCurrentUser();
      if (user) {
        return true;
      } else {
        // Capturar la URL original y pasarla como parámetro returnUrl
        console.log('🔒 Usuario no autenticado, redirigiendo al login con returnUrl:', state.url);
        this.router.navigate(['/login'], { 
          queryParams: { returnUrl: state.url } 
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error en DirectAuthGuard:', error);
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: state.url } 
      });
      return false;
    }
  }
}