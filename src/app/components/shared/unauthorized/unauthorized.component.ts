import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-unauthorized',
  templateUrl: './unauthorized.component.html',
  styleUrls: ['./unauthorized.component.css']
})
export class UnauthorizedComponent {
  userRole: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    const profile = this.authService.getCurrentProfile();
    this.userRole = profile?.rol || null;
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.authService.signOut().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}