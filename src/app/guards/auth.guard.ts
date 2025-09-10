import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    // Temporalmente permitir acceso sin autenticación para pruebas
    console.log('🔓 AuthGuard: Permitiendo acceso temporal para pruebas');
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        console.log('🔐 Estado de autenticación:', isAuthenticated);
        // Comentado temporalmente para pruebas
        // if (!isAuthenticated) {
        //   this.router.navigate(['/login']);
        //   return false;
        // }
        return true; // Siempre permitir acceso
      })
    );
  }
}