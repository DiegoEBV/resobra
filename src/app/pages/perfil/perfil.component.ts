import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="perfil-container">
      <mat-card>
        <mat-card-header>
          <div mat-card-avatar class="profile-avatar">
            <mat-icon>person</mat-icon>
          </div>
          <mat-card-title>Mi Perfil</mat-card-title>
          <mat-card-subtitle>Gestiona tu información personal</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando perfil...</p>
          </div>

          <form *ngIf="!loading && profileForm" [formGroup]="profileForm" (ngSubmit)="updateProfile()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre completo</mat-label>
                <input matInput formControlName="nombre" placeholder="Ingresa tu nombre completo">
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="profileForm.get('nombre')?.hasError('required')">
                  El nombre es requerido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Correo electrónico</mat-label>
                <input matInput formControlName="email" type="email" placeholder="correo@ejemplo.com">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="profileForm.get('email')?.hasError('required')">
                  El correo es requerido
                </mat-error>
                <mat-error *ngIf="profileForm.get('email')?.hasError('email')">
                  Ingresa un correo válido
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Rol</mat-label>
                <mat-select formControlName="rol">
                  <mat-option value="residente">Residente</mat-option>
                  <mat-option value="logistica">Logística</mat-option>
                </mat-select>
                <mat-icon matSuffix>work</mat-icon>
              </mat-form-field>
            </div>

            <div class="profile-info" *ngIf="currentProfile">
              <div class="info-item">
                <mat-icon>schedule</mat-icon>
                <span>Cuenta creada: {{ formatDate(currentProfile.created_at) }}</span>
              </div>
              <div class="info-item" *ngIf="currentProfile.updated_at">
                <mat-icon>update</mat-icon>
                <span>Última actualización: {{ formatDate(currentProfile.updated_at) }}</span>
              </div>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions align="end" *ngIf="!loading">
          <button mat-button type="button" (click)="cancelChanges()" [disabled]="saving">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          <button mat-raised-button color="primary" (click)="updateProfile()" [disabled]="!profileForm?.valid || saving">
            <mat-spinner *ngIf="saving" diameter="20" class="button-spinner"></mat-spinner>
            <mat-icon *ngIf="!saving">save</mat-icon>
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .perfil-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    .profile-avatar {
      background-color: #1976d2;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      text-align: center;
    }

    .loading-container p {
      margin-top: 16px;
      color: #666;
    }

    .form-row {
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .profile-info {
      margin-top: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      color: #666;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .info-item mat-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .button-spinner {
      margin-right: 8px;
    }

    mat-card-actions {
      padding: 16px 24px;
    }
  `]
})
export class PerfilComponent implements OnInit {
  profileForm: FormGroup | null = null;
  currentProfile: UserProfile | null = null;
  loading = true;
  saving = false;
  originalFormValue: any = null;

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading = true;
    
    // Suscribirse al perfil actual
    this.authService.currentProfile$.subscribe(profile => {
      if (profile) {
        this.currentProfile = profile;
        this.initializeForm(profile);
        this.loading = false;
      } else {
        // Si no hay perfil, intentar cargar desde el usuario actual
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          // El AuthService debería cargar automáticamente el perfil
          setTimeout(() => {
            const retryProfile = this.authService.getCurrentProfile();
            if (retryProfile) {
              this.currentProfile = retryProfile;
              this.initializeForm(retryProfile);
            }
            this.loading = false;
          }, 1000);
        } else {
          this.loading = false;
          this.snackBar.open('Error: Usuario no autenticado', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  private initializeForm(profile: UserProfile): void {
    this.profileForm = this.formBuilder.group({
      nombre: [profile.nombre, [Validators.required, Validators.minLength(2)]],
      email: [profile.email, [Validators.required, Validators.email]],
      rol: [profile.rol, [Validators.required]]
    });
    
    // Guardar valores originales para poder cancelar cambios
    this.originalFormValue = this.profileForm.value;
  }

  updateProfile(): void {
    if (!this.profileForm || !this.profileForm.valid) {
      this.snackBar.open('Por favor, completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving = true;
    const formValue = this.profileForm.value;
    
    this.authService.updateProfile(formValue).subscribe({
      next: (result) => {
        if (result.error) {
          // Error updating profile
          this.snackBar.open('Error al actualizar el perfil: ' + result.error.message, 'Cerrar', { duration: 5000 });
        } else {
          this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.originalFormValue = formValue;
        }
        this.saving = false;
      },
      error: (error) => {
        // Error updating profile
        this.snackBar.open('Error al actualizar el perfil', 'Cerrar', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  cancelChanges(): void {
    if (this.profileForm && this.originalFormValue) {
      this.profileForm.patchValue(this.originalFormValue);
      this.snackBar.open('Cambios cancelados', 'Cerrar', { duration: 2000 });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}