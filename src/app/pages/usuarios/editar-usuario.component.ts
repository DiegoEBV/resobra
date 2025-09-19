import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';

import { UsuariosService } from '../../services/usuarios.service';
import { Usuario, ActualizarUsuarioRequest } from '../../interfaces/usuario.interface';

@Component({
  selector: 'app-editar-usuario',
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
    MatTooltipModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  template: `
    <div class="editar-usuario-container">
      <!-- Header -->
      <div class="header-section">
        <button mat-icon-button (click)="volver()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1>Editar Usuario</h1>
          <p *ngIf="usuario">{{ usuario.nombre }} - {{ usuario.email }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-container" *ngIf="cargandoUsuario">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Cargando información del usuario...</p>
      </div>

      <!-- Formulario -->
      <div *ngIf="!cargandoUsuario && usuario">
        <!-- Información del usuario -->
        <mat-card class="user-info-card">
          <mat-card-content>
            <div class="user-header">
              <div class="user-avatar">
                {{ getInitials(usuario.nombre) }}
              </div>
              <div class="user-details">
                <h3>{{ usuario.nombre }}</h3>
                <p>{{ usuario.email }}</p>
                <div class="user-meta">
                  <span class="role-chip" [class]="'chip-' + usuario.rol">
                    {{ getRolLabel(usuario.rol) }}
                  </span>
                  <span class="status-chip" [class]="usuario.activo !== false ? 'chip-activo' : 'chip-inactivo'">
                    {{ usuario.activo !== false ? 'Activo' : 'Inactivo' }}
                  </span>
                  <span class="date-info">
                    Creado: {{ formatDate(usuario.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Formulario de edición -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>edit</mat-icon>
              Editar Información
            </mat-card-title>
            <mat-card-subtitle>
              Modifique los datos del usuario según sea necesario
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

              <mat-divider></mat-divider>

              <!-- Estado del usuario -->
              <div class="form-section">
                <h3>Estado del Usuario</h3>
                
                <div class="toggle-section">
                  <mat-slide-toggle 
                    formControlName="activo"
                    color="primary">
                    Usuario activo
                  </mat-slide-toggle>
                  <p class="toggle-description">
                    Los usuarios inactivos no pueden acceder al sistema
                  </p>
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
                
                <button mat-button 
                        type="button" 
                        color="accent"
                        (click)="cambiarPassword()"
                        [disabled]="guardando">
                  <mat-icon>lock_reset</mat-icon>
                  Cambiar Contraseña
                </button>
                
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="usuarioForm.invalid || !usuarioForm.dirty || guardando">
                  <mat-spinner diameter="20" *ngIf="guardando"></mat-spinner>
                  <mat-icon *ngIf="!guardando">save</mat-icon>
                  {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Acciones peligrosas -->
        <mat-card class="danger-card">
          <mat-card-header>
            <mat-card-title class="danger-title">
              <mat-icon>warning</mat-icon>
              Zona Peligrosa
            </mat-card-title>
            <mat-card-subtitle>
              Estas acciones son irreversibles
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="danger-actions">
              <div class="danger-action">
                <div class="action-info">
                  <h4>Eliminar Usuario</h4>
                  <p>Elimina permanentemente el usuario y todos sus datos asociados</p>
                </div>
                <button mat-stroked-button 
                        color="warn"
                        (click)="eliminarUsuario()"
                        [disabled]="guardando">
                  <mat-icon>delete_forever</mat-icon>
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Error al cargar -->
      <mat-card *ngIf="!cargandoUsuario && !usuario" class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon>error_outline</mat-icon>
            <h3>Usuario no encontrado</h3>
            <p>No se pudo cargar la información del usuario solicitado.</p>
            <button mat-raised-button color="primary" (click)="volver()">
              <mat-icon>arrow_back</mat-icon>
              Volver a la lista
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .editar-usuario-container {
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

    .header-info h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 500;
      color: #333;
    }

    .header-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 0.875rem;
    }

    .back-button {
      color: #666;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .user-info-card {
      margin-bottom: 24px;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 24px;
    }

    .user-details h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }

    .user-details p {
      margin: 4px 0 8px 0;
      color: #666;
    }

    .user-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .role-chip, .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .chip-residente {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .chip-logistica {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .chip-activo {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .chip-inactivo {
      background-color: #ffebee;
      color: #c62828;
    }

    .date-info {
      font-size: 0.75rem;
      color: #999;
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

    .toggle-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .toggle-description {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e0e0e0;
    }

    .danger-card {
      border: 1px solid #ffcdd2;
      background-color: #fafafa;
    }

    .danger-title {
      color: #d32f2f;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .danger-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .danger-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #ffcdd2;
      border-radius: 8px;
      background-color: white;
    }

    .action-info h4 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 500;
      color: #333;
    }

    .action-info p {
      margin: 0;
      font-size: 0.875rem;
      color: #666;
    }

    .error-card {
      text-align: center;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 24px;
    }

    .error-content mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .error-content h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: #333;
    }

    .error-content p {
      margin: 0;
      color: #666;
    }

    .error {
      border-color: #f44336 !important;
    }

    @media (max-width: 768px) {
      .editar-usuario-container {
        padding: 16px;
      }

      .user-header {
        flex-direction: column;
        text-align: center;
      }

      .user-meta {
        justify-content: center;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }

      .danger-action {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }
    }
  `]
})
export class EditarUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  usuario: Usuario | null = null;
  usuarioId: string = '';
  cargandoUsuario = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.usuarioForm = this.createForm();
  }

  ngOnInit() {
    this.usuarioId = this.route.snapshot.paramMap.get('id') || '';
    if (this.usuarioId) {
      this.cargarUsuario();
    } else {
      this.volver();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required],
      activo: [true]
    });
  }

  private async cargarUsuario() {
    try {
      this.cargandoUsuario = true;
      
      // Verificar permisos
      const tienePermisos = await this.usuariosService.verificarPermisosResidente();
      if (!tienePermisos) {
        this.mostrarError('No tiene permisos para editar usuarios');
        this.volver();
        return;
      }

      this.usuario = await this.usuariosService.getUsuarioById(this.usuarioId);
      
      if (this.usuario) {
        this.usuarioForm.patchValue({
          nombre: this.usuario.nombre,
          email: this.usuario.email,
          rol: this.usuario.rol,
          activo: this.usuario.activo !== false
        });
      }

    } catch (error) {
      console.error('Error al cargar usuario:', error);
      this.mostrarError('Error al cargar la información del usuario');
    } finally {
      this.cargandoUsuario = false;
    }
  }

  async onSubmit() {
    if (this.usuarioForm.valid && this.usuarioForm.dirty && !this.guardando) {
      try {
        this.guardando = true;
        
        const formData = this.usuarioForm.value;
        const updates: ActualizarUsuarioRequest = {
          nombre: formData.nombre.trim(),
          email: formData.email.trim().toLowerCase(),
          rol: formData.rol,
          activo: formData.activo
        };

        this.usuario = await this.usuariosService.updateUsuario(this.usuarioId, updates);
        
        this.mostrarExito('Usuario actualizado exitosamente');
        this.usuarioForm.markAsPristine();

      } catch (error: any) {
        console.error('Error al actualizar usuario:', error);
        
        let mensaje = 'Error al actualizar el usuario';
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

  cambiarPassword() {
    if (!this.usuario) return;

    const newPassword = prompt(`Ingrese la nueva contraseña para ${this.usuario.nombre}:`);
    
    if (!newPassword) return;

    this.usuariosService.cambiarPassword(this.usuarioId, newPassword)
      .then(() => {
        this.mostrarExito('Contraseña cambiada exitosamente');
      })
      .catch(error => {
        console.error('Error al cambiar contraseña:', error);
        this.mostrarError('Error al cambiar la contraseña');
      });
  }

  async eliminarUsuario() {
    if (!this.usuario) return;

    const confirmacion = confirm(
      `¿Está seguro que desea eliminar al usuario ${this.usuario.nombre}?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmacion) return;

    try {
      await this.usuariosService.deleteUsuario(this.usuarioId);
      this.mostrarExito('Usuario eliminado exitosamente');
      this.volver();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      this.mostrarError('Error al eliminar el usuario');
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

  getInitials(nombre: string): string {
    return nombre
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRolLabel(rol: string): string {
    const roles: { [key: string]: string } = {
      'residente': 'Residente',
      'logistica': 'Logística'
    };
    return roles[rol] || rol;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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