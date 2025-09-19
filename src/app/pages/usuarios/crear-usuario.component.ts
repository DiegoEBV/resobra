import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { UsuariosService } from '../../services/usuarios.service';
import { CrearUsuarioRequest } from '../../interfaces/usuario.interface';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="crear-usuario-container">
      <!-- Header -->
      <div class="header-section">
        <button mat-icon-button (click)="volver()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Crear Nuevo Usuario</h1>
      </div>

      <!-- Formulario -->
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            Información del Usuario
          </mat-card-title>
          <mat-card-subtitle>
            Complete los datos para crear un nuevo usuario en el sistema
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="usuarioForm" (ngSubmit)="onSubmit()" class="usuario-form">
            <!-- Información Personal -->
            <div class="form-section">
              <h3>Información Personal</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre completo</mat-label>
                <input matInput 
                       formControlName="nombre"
                       placeholder="Ingrese el nombre completo"
                       [class.error]="isFieldInvalid('nombre')">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="usuarioForm.get('nombre')?.hasError('required')">
                  El nombre es requerido
                </mat-error>
                <mat-error *ngIf="usuarioForm.get('nombre')?.hasError('minlength')">
                  El nombre debe tener al menos 2 caracteres
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput 
                       type="email"
                       formControlName="email"
                       placeholder="usuario@ejemplo.com"
                       [class.error]="isFieldInvalid('email')">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="usuarioForm.get('email')?.hasError('required')">
                  El email es requerido
                </mat-error>
                <mat-error *ngIf="usuarioForm.get('email')?.hasError('email')">
                  Ingrese un email válido
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Rol</mat-label>
                <mat-select formControlName="rol" [class.error]="isFieldInvalid('rol')">
                  <mat-option value="residente">
                    <mat-icon>engineering</mat-icon>
                    Residente
                  </mat-option>
                  <mat-option value="logistica">
                    <mat-icon>local_shipping</mat-icon>
                    Logística
                  </mat-option>
                </mat-select>
                <mat-icon matSuffix>work</mat-icon>
                <mat-error *ngIf="usuarioForm.get('rol')?.hasError('required')">
                  Seleccione un rol
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Seguridad -->
            <div class="form-section">
              <h3>Seguridad</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Contraseña</mat-label>
                <input matInput 
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       placeholder="Mínimo 8 caracteres"
                       [class.error]="isFieldInvalid('password')">
                <button mat-icon-button 
                        matSuffix 
                        type="button"
                        (click)="hidePassword = !hidePassword"
                        [attr.aria-label]="'Hide password'"
                        [attr.aria-pressed]="hidePassword">
                  <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="usuarioForm.get('password')?.hasError('required')">
                  La contraseña es requerida
                </mat-error>
                <mat-error *ngIf="usuarioForm.get('password')?.hasError('minlength')">
                  La contraseña debe tener al menos 8 caracteres
                </mat-error>
                <mat-error *ngIf="usuarioForm.get('password')?.hasError('pattern')">
                  La contraseña debe incluir mayúsculas, minúsculas y números
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirmar contraseña</mat-label>
                <input matInput 
                       [type]="hideConfirmPassword ? 'password' : 'text'"
                       formControlName="confirmPassword"
                       placeholder="Repita la contraseña"
                       [class.error]="isFieldInvalid('confirmPassword')">
                <button mat-icon-button 
                        matSuffix 
                        type="button"
                        (click)="hideConfirmPassword = !hideConfirmPassword"
                        [attr.aria-label]="'Hide password'"
                        [attr.aria-pressed]="hideConfirmPassword">
                  <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="usuarioForm.get('confirmPassword')?.hasError('required')">
                  Confirme la contraseña
                </mat-error>
                <mat-error *ngIf="usuarioForm.hasError('passwordMismatch') && !usuarioForm.get('confirmPassword')?.hasError('required')">
                  Las contraseñas no coinciden
                </mat-error>
              </mat-form-field>

              <!-- Indicador de fortaleza de contraseña -->
              <div class="password-strength" *ngIf="usuarioForm.get('password')?.value">
                <div class="strength-label">Fortaleza de la contraseña:</div>
                <div class="strength-bar">
                  <div class="strength-fill" [class]="getPasswordStrengthClass()"></div>
                </div>
                <div class="strength-text" [class]="getPasswordStrengthClass()">
                  {{ getPasswordStrengthText() }}
                </div>
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="form-actions">
              <button mat-button 
                      type="button" 
                      (click)="volver()"
                      [disabled]="guardando">
                <mat-icon>cancel</mat-icon>
                Cancelar
              </button>
              
              <button mat-raised-button 
                      color="primary" 
                      type="submit"
                      [disabled]="usuarioForm.invalid || guardando">
                <mat-spinner diameter="20" *ngIf="guardando"></mat-spinner>
                <mat-icon *ngIf="!guardando">save</mat-icon>
                {{ guardando ? 'Creando...' : 'Crear Usuario' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Información adicional -->
      <mat-card class="info-card">
        <mat-card-content>
          <div class="info-section">
            <mat-icon color="primary">info</mat-icon>
            <div class="info-text">
              <h4>Información importante</h4>
              <ul>
                <li>El usuario recibirá un email de confirmación para activar su cuenta</li>
                <li>La contraseña debe tener al menos 8 caracteres con mayúsculas, minúsculas y números</li>
                <li>El rol determina los permisos y accesos del usuario en el sistema</li>
                <li>Los usuarios se crean en estado activo por defecto</li>
              </ul>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .crear-usuario-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
      gap: 16px;
    }

    .header-section h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
      color: #333;
    }

    .back-button {
      color: #666;
    }

    .form-card {
      margin-bottom: 24px;
    }

    .form-card mat-card-header {
      margin-bottom: 24px;
    }

    .form-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.5rem;
    }

    .usuario-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-section h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: #333;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 8px;
    }

    .full-width {
      width: 100%;
    }

    .password-strength {
      margin-top: -8px;
      margin-bottom: 8px;
    }

    .strength-label {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 4px;
    }

    .strength-bar {
      width: 100%;
      height: 4px;
      background-color: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .strength-fill {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .strength-fill.weak {
      width: 33%;
      background-color: #f44336;
    }

    .strength-fill.medium {
      width: 66%;
      background-color: #ff9800;
    }

    .strength-fill.strong {
      width: 100%;
      background-color: #4caf50;
    }

    .strength-text {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .strength-text.weak {
      color: #f44336;
    }

    .strength-text.medium {
      color: #ff9800;
    }

    .strength-text.strong {
      color: #4caf50;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .info-card {
      background-color: #f8f9fa;
    }

    .info-section {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .info-text h4 {
      margin: 0 0 8px 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .info-text ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
    }

    .info-text li {
      margin-bottom: 4px;
      font-size: 0.875rem;
    }

    .error {
      border-color: #f44336 !important;
    }

    @media (max-width: 768px) {
      .crear-usuario-container {
        padding: 16px;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }

      .info-section {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class CrearUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  guardando = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.usuarioForm = this.createForm();
  }

  ngOnInit() {
    // Verificar permisos de residente
    this.verificarPermisos();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  private async verificarPermisos() {
    try {
      const tienePermisos = await this.usuariosService.verificarPermisosResidente();
      if (!tienePermisos) {
        this.mostrarError('No tiene permisos para crear usuarios');
        this.volver();
      }
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      this.mostrarError('Error al verificar permisos');
      this.volver();
    }
  }

  async onSubmit() {
    if (this.usuarioForm.valid && !this.guardando) {
      try {
        this.guardando = true;
        
        const formData = this.usuarioForm.value;
        const nuevoUsuario: CrearUsuarioRequest = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim().toLowerCase(),
          rol: formData.rol,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        };

        await this.usuariosService.createUsuario(nuevoUsuario);
        
        this.mostrarExito('Usuario creado exitosamente');
        this.volver();

      } catch (error: any) {
        console.error('Error al crear usuario:', error);
        
        let mensaje = 'Error al crear el usuario';
        if (error.message) {
          mensaje = error.message;
        } else if (error.error?.message) {
          mensaje = error.error.message;
        }
        
        this.mostrarError(mensaje);
      } finally {
        this.guardando = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.usuarioForm.controls).forEach(key => {
      const control = this.usuarioForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.usuarioForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPasswordStrengthClass(): string {
    const password = this.usuarioForm.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);
    
    if (strength < 3) return 'weak';
    if (strength < 5) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const password = this.usuarioForm.get('password')?.value || '';
    const strength = this.calculatePasswordStrength(password);
    
    if (strength < 3) return 'Débil';
    if (strength < 5) return 'Media';
    return 'Fuerte';
  }

  private calculatePasswordStrength(password: string): number {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;
    
    return strength;
  }

  volver() {
    this.router.navigate(['/usuarios']);
  }

  private mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}