import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];
    
    return this.authService.currentProfile$.pipe(
      take(1),
      map(profile => {
        if (!profile) {
          this.router.navigate(['/login']);
          return false;
        }

        if (requiredRoles && !requiredRoles.includes(profile.rol)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        return true;
      })
    )
  }
}
