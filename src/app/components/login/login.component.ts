import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DirectAuthService } from '../../services/direct-auth.service';
// Importaciones de RxJS ya no necesarias con DirectAuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Sistema de Gestión de Carreteras</mat-card-title>
          <mat-card-subtitle>Iniciar Sesión</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" required>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Ingrese un email válido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password" required>
              <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                La contraseña es requerida
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" 
                    class="full-width login-button" 
                    [disabled]="loginForm.invalid || isLoading">
              <mat-spinner *ngIf="isLoading" diameter="20"></mat-spinner>
              <span *ngIf="!isLoading">Iniciar Sesión</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .login-button {
      height: 48px;
      margin-top: 16px;
    }
    
    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private directAuthService: DirectAuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Método waitForCompleteAuth ya no es necesario con DirectAuthService
  // DirectAuthService maneja la autenticación de forma síncrona

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      
      console.log('📤 Usando DirectAuthService para login...');
      
      try {
        const result = await this.directAuthService.login(email, password);
        
        this.isLoading = false;
        
        if (result.user && !result.error) {
          this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          console.log('✅ Login exitoso, navegando al dashboard...');
          this.router.navigate(['/dashboard']);
        } else {
          let errorMessage = result.error?.message || 'Error al iniciar sesión';
          
          if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = 'Credenciales inválidas. Por favor verifique su email y contraseña.';
          }
          
          this.snackBar.open(errorMessage, 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      } catch (error: any) {
        this.isLoading = false;
        console.error('❌ Error de conexión:', error);
        this.snackBar.open('Error de conexión. Intente nuevamente más tarde.', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
      
      /*
      // Código anterior con AuthService
      this.authService.signIn(email, password).subscribe({
        next: ({ user, error }) => {
          this.isLoading = false;
          if (error) {
            // Login error
            let errorMessage = 'Error al iniciar sesión';
            
            // Manejar errores específicos de Supabase
            if (error.message && error.message.includes('Invalid login credentials')) {
              errorMessage = 'Credenciales inválidas. Por favor verifique su email y contraseña.';
            } else if (error.message && error.message.includes('Email not confirmed')) {
              errorMessage = 'La cuenta no ha sido confirmada. Por favor contacte al administrador.';
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.snackBar.open(errorMessage, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          } else if (user) {
            // Login successful
            this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Forzar actualización del estado de autenticación
            this.authService.forceAuthStateUpdate().then(() => {
              console.log('🔄 Estado de autenticación actualizado');
              
              // Esperar a que tanto la sesión como el perfil estén cargados
              this.waitForCompleteAuth().then(() => {
                console.log('🏠 Datos de autenticación completos, navegando al dashboard...');
                // Usar NgZone para asegurar que la navegación ocurra correctamente
                this.ngZone.run(() => {
                  setTimeout(() => {
                    this.router.navigate(['/dashboard']).then(() => {
                      console.log('✅ Navegación al dashboard completada exitosamente');
                      this.cdr.detectChanges();
                    }).catch((navError) => {
                      console.error('❌ Error en navegación:', navError);
                      // Intentar navegación alternativa
                      window.location.href = '/dashboard';
                    });
                  }, 100);
                });
              }).catch((error) => {
                console.warn('⚠️ Timeout esperando datos completos, navegando de todas formas:', error);
                this.ngZone.run(() => {
                  setTimeout(() => {
                    this.router.navigate(['/dashboard']).catch((navError) => {
                      console.error('❌ Error en navegación de fallback:', navError);
                      window.location.href = '/dashboard';
                    });
                  }, 100);
                });
              });
            }).catch((forceError) => {
              console.error('❌ Error forzando actualización de estado:', forceError);
              // Continuar con el flujo normal aunque falle la actualización forzada
              this.waitForCompleteAuth().then(() => {
                this.ngZone.run(() => {
                  this.router.navigate(['/dashboard']);
                });
              }).catch(() => {
                this.ngZone.run(() => {
                  this.router.navigate(['/dashboard']);
                });
              });
            });
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('❌ Error de conexión:', err);
          this.snackBar.open('Error de conexión. Intente nuevamente más tarde.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
      */
    } else {
      console.log('⚠️ Formulario de login inválido');
    }
  }
}