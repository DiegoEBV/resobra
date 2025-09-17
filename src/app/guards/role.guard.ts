import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { DirectAuthService } from '../services/direct-auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private directAuthService: DirectAuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
    const requiredRoles = route.data['roles'] as string[];
    
    const profile = this.directAuthService.getCurrentProfile();
    
    if (!profile) {
      this.router.navigate(['/login']);
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    if (requiredRoles && !requiredRoles.includes(profile.rol)) {
      this.router.navigate(['/unauthorized']);
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }
}
