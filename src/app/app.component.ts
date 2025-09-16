import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
  isInitialized = false; // Nueva propiedad para controlar la inicialización
  currentUser: any = null;
  currentProfile: any = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    console.log('🚀 AppComponent inicializando...');
    
    // Suscribirse al estado de autenticación con mejor manejo
    this.authService.isAuthenticated$.subscribe(isAuth => {
      this.ngZone.run(() => {
        console.log('🔐 Estado de autenticación cambió:', isAuth);
        this.isAuthenticated = isAuth;
        
        // Si el usuario se autentica, asegurar que la UI se actualice
        if (isAuth) {
          console.log('✅ Usuario autenticado, actualizando UI...');
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
        
        this.cdr.detectChanges();
      });
    });

    // Suscribirse al usuario actual
    this.authService.currentUser$.subscribe(user => {
      this.ngZone.run(() => {
        console.log('👤 Usuario actual:', user);
        this.cdr.detectChanges();
      });
    });

    // Suscribirse al perfil actual
    this.authService.currentProfile$.subscribe(profile => {
      this.ngZone.run(() => {
        console.log('📋 Perfil actual:', profile);
        this.currentProfile = profile;
        this.cdr.detectChanges();
      });
    });

    // Marcar como inicializado
    setTimeout(() => {
      this.ngZone.run(() => {
        this.isInitialized = true;
        console.log('✅ AppComponent inicializado');
        this.cdr.detectChanges();
      });
    }, 300);
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
    console.log('🚪 Iniciando logout...');
    this.authService.signOut().subscribe({
      next: (result) => {
        if (!result.error) {
          console.log('✅ Logout completado');
          this.router.navigate(['/login']);
        } else {
          console.error('❌ Error durante logout:', result.error);
        }
      },
      error: (error) => {
        console.error('❌ Error durante logout:', error);
      }
    });
  }
}
