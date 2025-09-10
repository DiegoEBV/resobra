import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { Router, ActivatedRoute } from '@angular/router';
import { ActividadesService, Frente } from '../../services/actividades.service';

@Component({
  selector: 'app-frente-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatCardModule
  ],
  templateUrl: './frente-edit.component.html',
  styleUrl: './frente-edit.component.css'
})
export class FrenteEditComponent implements OnInit {
  frenteForm: FormGroup;
  loading = false;
  obras: any[] = [];
  frenteId: string | null = null;
  frente: Frente | null = null;

  estadosFrente = [
    { value: 'activo', label: 'Activo' },
    { value: 'pausado', label: 'Pausado' },
    { value: 'completado', label: 'Completado' },
    { value: 'planificado', label: 'Planificado' }
  ];

  constructor(
    private fb: FormBuilder,
    private actividadesService: ActividadesService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.frenteForm = this.createForm();
  }

  ngOnInit(): void {
    this.frenteId = this.route.snapshot.paramMap.get('id');
    if (this.frenteId) {
      this.loadFrente();
      this.loadObras();
    } else {
      this.router.navigate(['/frentes']);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      obra_id: ['', Validators.required],
      estado: ['activo', Validators.required],
      fecha_inicio: [new Date(), Validators.required],
      fecha_fin_estimada: [''],
      ubicacion_lat: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      ubicacion_lng: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      progreso_general: [0, [Validators.min(0), Validators.max(100)]],
      km_inicial: [null, [Validators.required, Validators.min(0)]],
      km_final: [null, [Validators.required, Validators.min(0)]],
      coordenadas_inicio: [''],
      coordenadas_fin: ['']
    });
  }

  private async loadFrente(): Promise<void> {
    if (!this.frenteId) return;
    
    try {
      this.loading = true;
      this.frente = await this.actividadesService.getFrenteById(this.frenteId);
      
      if (this.frente) {
        this.populateForm(this.frente);
      } else {
        this.snackBar.open('Frente no encontrado', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.router.navigate(['/mapa']);
      }
    } catch (error) {
      console.error('Error loading frente:', error);
      this.snackBar.open('Error al cargar el frente', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.router.navigate(['/mapa']);
    } finally {
      this.loading = false;
    }
  }

  private populateForm(frente: Frente): void {
    this.frenteForm.patchValue({
      nombre: frente.nombre,
      descripcion: frente.descripcion || '',
      obra_id: frente.obra_id,
      estado: frente.estado,
      fecha_inicio: new Date(frente.fecha_inicio),
      fecha_fin_estimada: frente.fecha_fin_estimada ? new Date(frente.fecha_fin_estimada) : null,
      ubicacion_lat: frente.ubicacion_lat,
      ubicacion_lng: frente.ubicacion_lng,
      progreso_general: frente.progreso_general,
      km_inicial: frente.km_inicial || null,
      km_final: frente.km_final || null,
      coordenadas_inicio: frente.coordenadas_inicio || '',
      coordenadas_fin: frente.coordenadas_fin || ''
    });
  }

  private async loadObras(): Promise<void> {
    try {
      this.obras = await this.actividadesService.getUserObras();
    } catch (error) {
      console.error('Error loading obras:', error);
      this.snackBar.open('Error al cargar las obras', 'Cerrar', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.frenteForm.valid && this.frenteId) {
      this.loading = true;
      try {
        const formValue = this.frenteForm.value;
        
        const frenteData = {
          ...formValue,
          fecha_inicio: formValue.fecha_inicio.toISOString().split('T')[0],
          fecha_fin_estimada: formValue.fecha_fin_estimada ? 
            formValue.fecha_fin_estimada.toISOString().split('T')[0] : null
        };

        await this.actividadesService.updateFrente(this.frenteId, frenteData);
        
        this.snackBar.open('Frente actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.router.navigate(['/frentes']);
      } catch (error) {
        console.error('Error updating frente:', error);
        this.snackBar.open('Error al actualizar el frente', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.loading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.frenteForm.controls).forEach(key => {
      const control = this.frenteForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/frentes']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.frenteForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} debe ser mayor a ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} debe ser menor a ${control.errors?.['max'].max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      obra_id: 'Obra',
      estado: 'Estado',
      fecha_inicio: 'Fecha de inicio',
      fecha_fin_estimada: 'Fecha fin estimada',
      ubicacion_lat: 'Latitud',
      ubicacion_lng: 'Longitud',
      progreso_general: 'Progreso general'
    };
    return labels[fieldName] || fieldName;
  }
}