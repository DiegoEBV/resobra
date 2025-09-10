import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ]
})
export class AppComponent implements OnInit {
  title = 'Sistema de Gestión de Rendimiento en Construcción de Carreteras';
  isAuthenticated = false;
  currentUser: any = null;
  currentProfile: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Verificar estado de autenticación al inicializar la app
    this.authService.currentUser$.subscribe((user: any) => {
      this.isAuthenticated = !!user;
      this.currentUser = user;
    });

    // Suscribirse al perfil del usuario para obtener el rol
    this.authService.currentProfile$.subscribe((profile: any) => {
      this.currentProfile = profile;
    });
    
    console.log('Sistema de Gestión de Rendimiento inicializado');
  }

  getCurrentDate(): string {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return today.toLocaleDateString('es-ES', options);
  }

  logout() {
    this.authService.signOut().subscribe({
      next: ({ error }) => {
        if (error) {
          console.error('Error al cerrar sesión:', error);
        } else {
          console.log('Sesión cerrada exitosamente');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error al cerrar sesión:', error);
      }
    });
  }
}
