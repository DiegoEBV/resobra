import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KpisService, KPI } from '../../services/kpis.service';
import { AuthService } from '../../services/auth.service';
import { ObrasService } from '../../services/obras.service';
import { Obra } from '../../interfaces/database.interface';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-kpis',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './kpis.component.html',
  styleUrls: ['./kpis.component.css']
})
export class KpisComponent implements OnInit {
  kpiForm: FormGroup;
  kpis: KPI[] = [];
  obras: Obra[] = [];
  loading = false;
  editingKpi: KPI | null = null;
  displayedColumns: string[] = ['fecha', 'obra', 'avance_fisico', 'productividad', 'calidad', 'desviacion_cronograma', 'acciones'];

  constructor(
    private fb: FormBuilder,
    private kpisService: KpisService,
    private obrasService: ObrasService,
    private snackBar: MatSnackBar
  ) {
    this.kpiForm = this.fb.group({
      obra_id: ['', Validators.required],
      fecha: [new Date(), Validators.required],
      avance_fisico: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      productividad: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      calidad: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      desviacion_cronograma: [0, Validators.required],
      metricas_adicionales: ['']
    });
  }

  ngOnInit() {
    this.loadObras();
    this.loadKpis();
  }

  loadObras(): void {
    this.obrasService.obras$.subscribe({
      next: (obras) => {
        this.obras = obras;
      },
      error: (error) => {
        console.error('Error loading obras:', error);
        this.showMessage('Error al cargar las obras');
      }
    });
  }

  async loadKpis() {
    try {
      this.loading = true;
      // Suscribirse a los KPIs del servicio
      this.kpisService.kpis$.subscribe({
        next: (kpis) => {
          this.kpis = kpis;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading KPIs:', error);
          this.showMessage('Error al cargar los KPIs');
          this.loading = false;
        }
      });
    } catch (error) {
      console.error('Error loading KPIs:', error);
      this.showMessage('Error al cargar los KPIs');
      this.loading = false;
    }
  }

  async onSubmit() {
    if (this.kpiForm.valid) {
      try {
        this.loading = true;
        const formData = this.kpiForm.value;
        
        // Preparar datos que coincidan con el schema de la tabla kpis
        const kpiData = {
          obra_id: formData.obra_id,
          fecha: formData.fecha instanceof Date ? formData.fecha.toISOString().split('T')[0] : formData.fecha,
          avance_fisico: formData.avance_fisico,
          productividad: formData.productividad,
          calidad: formData.calidad,
          desviacion_cronograma: formData.desviacion_cronograma,
          metricas_adicionales: formData.metricas_adicionales ? { notas: formData.metricas_adicionales } : null
        };
        
        if (this.editingKpi && this.editingKpi.id) {
          await this.kpisService.updateKPI(this.editingKpi.id, kpiData);
          this.showMessage('KPI actualizado exitosamente');
        } else {
          await this.kpisService.createKPI(kpiData);
          this.showMessage('KPI creado exitosamente');
        }
        
        this.resetForm();
        this.loadKpis();
      } catch (error) {
        console.error('Error saving KPI:', error);
        this.showMessage('Error al guardar el KPI');
      } finally {
        this.loading = false;
      }
    }
  }

  editKpi(kpi: KPI) {
    this.editingKpi = kpi;
    this.kpiForm.patchValue({
      obra_id: kpi.obra_id,
      fecha: new Date(kpi.fecha),
      avance_fisico: kpi.avance_fisico || 0,
      productividad: kpi.productividad || 0,
      calidad: kpi.calidad || 0,
      desviacion_cronograma: kpi.desviacion_cronograma || 0,
      metricas_adicionales: kpi.metricas_adicionales?.notas || ''
    });
  }

  async deleteKpi(kpi: KPI) {
    if (confirm('¿Está seguro de que desea eliminar este KPI?')) {
      try {
        this.loading = true;
        if (kpi.id) {
          await this.kpisService.deleteKPI(kpi.id);
        }
        this.showMessage('KPI eliminado exitosamente');
        this.loadKpis();
      } catch (error) {
        console.error('Error deleting KPI:', error);
        this.showMessage('Error al eliminar el KPI');
      } finally {
        this.loading = false;
      }
    }
  }

  resetForm() {
    this.editingKpi = null;
    this.kpiForm.reset({
      obra_id: '',
      fecha: new Date(),
      avance_fisico: 0,
      productividad: 0,
      calidad: 0,
      desviacion_cronograma: 0,
      metricas_adicionales: ''
    });
  }

  private calculateOverallValue(data: any): number {
    // Calcular un valor general basado en los KPIs individuales
    const weights = {
      avance_fisico: 0.3,
      productividad: 0.3,
      calidad: 0.4
    };
    
    return Math.round(
      (data.avance_fisico * weights.avance_fisico) +
      (data.productividad * weights.productividad) +
      (data.calidad * weights.calidad)
    );
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  getObraName(obraId: string): string {
    const obra = this.obras.find(o => o.id === obraId);
    return obra ? obra.nombre : 'N/A';
  }
}