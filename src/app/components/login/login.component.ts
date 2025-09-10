import { Component } from '@angular/core';
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
import { AuthService } from '../../services/auth.service';

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
            
            <div class="credentials-info">
              <h3>Credenciales de acceso:</h3>
              <div class="credential-item">
                <strong>RESIDENTE:</strong> RESIDENTE&#64;CVH.COM
              </div>
              <div class="credential-item">
                <strong>PRODUCCIÓN:</strong> PRODUCCION&#64;CVH.COM
              </div>
              <div class="credential-item">
                <strong>CONTRASEÑA:</strong> 123456
              </div>
            </div>
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    .credentials-info {
      margin-top: 24px;
      padding: 16px;
      background-color: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      border-left: 4px solid #3f51b5;
    }

    .credentials-info h3 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
      color: #3f51b5;
    }

    .credential-item {
      margin-bottom: 8px;
      font-size: 14px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { email, password } = this.loginForm.value;
      
      this.authService.signIn(email, password).subscribe({
        next: ({ user, error }) => {
          this.isLoading = false;
          if (error) {
            console.error('Error de autenticación:', error);
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
            this.snackBar.open('Inicio de sesión exitoso', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error de conexión:', err);
          this.snackBar.open('Error de conexión. Intente nuevamente más tarde.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}