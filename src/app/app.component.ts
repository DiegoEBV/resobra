import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DirectAuthService } from './services/direct-auth.service';

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
    private directAuthService: DirectAuthService, 
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // AppComponent inicializando
    
    // Verificar estado de autenticación inicial
    this.ngZone.run(() => {
      this.updateAuthState();
    });

    // Marcar como inicializado
    setTimeout(() => {
      this.ngZone.run(() => {
        this.isInitialized = true;
        // AppComponent inicializado
        this.cdr.detectChanges();
      });
    }, 300);

    // Verificar periódicamente si el perfil se ha cargado
    this.checkProfileUpdates();
  }

  private updateAuthState(): void {
    this.isAuthenticated = this.directAuthService.isAuthenticated();
    this.currentUser = this.directAuthService.getCurrentUser();
    this.currentProfile = this.directAuthService.getCurrentProfile();
    console.log('🔄 AppComponent - Estado actualizado:', {
      authenticated: this.isAuthenticated,
      user: this.currentUser?.email,
      profile: this.currentProfile?.rol
    });
    this.cdr.detectChanges();
  }

  private checkProfileUpdates(): void {
    // Verificar cada 1 segundo si el perfil se ha actualizado
    const interval = setInterval(() => {
      const newProfile = this.directAuthService.getCurrentProfile();
      if (newProfile && (!this.currentProfile || newProfile.rol !== this.currentProfile?.rol)) {
        console.log('✅ AppComponent - Perfil actualizado detectado');
        this.ngZone.run(() => {
          this.updateAuthState();
        });
        clearInterval(interval); // Detener verificación una vez que se carga el perfil
      }
    }, 1000);

    // Limpiar el intervalo después de 30 segundos para evitar bucles infinitos
    setTimeout(() => {
      clearInterval(interval);
    }, 30000);
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



  async logout() {
    // Iniciando logout
    try {
      await this.directAuthService.logout();
      // Logout completado
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentProfile = null;
      this.router.navigate(['/login']);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error durante logout:', error);
    }
  }
}