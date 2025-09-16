import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom, combineLatest, timer } from 'rxjs';
import { filter, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Redirigir si ya está autenticado
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.error = null;
      
      const { email, password } = this.loginForm.value;
      
      try {
        console.log('🔐 Iniciando proceso de login para:', email);
        
        const result = await firstValueFrom(
          this.authService.signIn(email, password)
        );
        
        if (result.user && !result.error) {
          console.log('✅ Login exitoso, esperando autenticación completa...');
          
          // Esperar a que la autenticación se complete totalmente
          await this.waitForCompleteAuth();
          
          console.log('🎯 Navegando al dashboard...');
          
          // Usar NgZone para asegurar que Angular detecte los cambios
          this.ngZone.run(async () => {
            try {
              // Forzar actualización del estado de autenticación
              await this.authService.forceAuthStateUpdate();
              
              // Pequeña pausa para asegurar que el estado se propague
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // Navegación con manejo robusto
              const navigationSuccess = await this.router.navigate(['/dashboard']);
              
              if (navigationSuccess) {
                console.log('✅ Navegación al dashboard exitosa');
                
                // Forzar recarga completa del estado de la aplicación
                window.location.reload();
              } else {
                console.error('❌ Error en la navegación al dashboard');
                // Fallback: recargar la página
                window.location.href = '/dashboard';
              }
            } catch (navError) {
              console.error('❌ Error durante la navegación:', navError);
              // Fallback final: recargar completamente
              window.location.href = '/dashboard';
            }
            
            // Forzar detección de cambios
            this.cdr.detectChanges();
          });
          
        } else {
          console.error('❌ Error en el login:', result.error);
          this.error = result.error?.message || 'Error de autenticación';
        }
        
      } catch (error: any) {
        console.error('❌ Error durante el login:', error);
        this.error = error.message || 'Error de conexión';
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }

  private getErrorMessage(error: any): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Credenciales inválidas. Verifique su email y contraseña.';
      case 'Email not confirmed':
        return 'Por favor confirme su email antes de iniciar sesión.';
      case 'Too many requests':
        return 'Demasiados intentos. Intente nuevamente más tarde.';
      default:
        return 'Error al iniciar sesión. Intente nuevamente.';
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'Email' : 'Contraseña'} es requerido`;
      }
      if (field.errors['email']) {
        return 'Email inválido';
      }
      if (field.errors['minlength']) {
        return 'La contraseña debe tener al menos 6 caracteres';
      }
    }
    return '';
  }
}