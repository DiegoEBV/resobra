import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProjectsService } from '../../services/projects.service';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { Project } from '../../models/interfaces';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './admin-projects.component.html',
  styleUrls: ['./admin-projects.component.scss']
})
export class AdminProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  displayedColumns: string[] = ['nombre', 'location', 'contractor', 'supervisor', 'start_date', 'presupuesto_total', 'presupuesto_ejecutado', 'acciones'];
  searchTerm: string = '';
  isLoading: boolean = false;
  editingProject: Project | null = null;
  editForm: FormGroup;

  constructor(
    private projectsService: ProjectsService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      location: ['', [Validators.required]],
      contractor: ['', [Validators.required]],
      supervisor: ['', [Validators.required]],
      start_date: ['', [Validators.required]],
      presupuesto_total: ['', [Validators.required, Validators.min(1)]],
      presupuesto_ejecutado: ['', [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.isLoading = true;
    try {
      this.projectsService.getAllProjects().subscribe({
        next: (projects) => {
          this.projects = projects;
          this.filterProjects();
          this.isLoading = false;
        },
        error: (error) => {
          // Error loading projects
          this.showMessage('Error al cargar las obras', 'error');
          this.isLoading = false;
        }
      });
    } catch (error) {
      // Error loading projects
      this.showMessage('Error al cargar las obras', 'error');
      this.isLoading = false;
    }
  }

  filterProjects(): void {
    let filtered = this.projects;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(term) ||
        (project.location && project.location.toLowerCase().includes(term)) ||
        (project.contractor && project.contractor.toLowerCase().includes(term)) ||
        (project.supervisor && project.supervisor.toLowerCase().includes(term))
      );
    }

    this.filteredProjects = filtered;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createProject(result);
      }
    });
  }

  private async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      await this.projectsService.createProject(projectData);
      this.showMessage('Obra creada exitosamente', 'success');
      this.loadProjects();
    } catch (error) {
      // Error creating project
      this.showMessage('Error al crear la obra', 'error');
    }
  }

  startEdit(project: Project): void {
    this.editingProject = project;
    this.editForm.patchValue({
      name: project.name,
      location: project.location || '',
      contractor: project.contractor || '',
      supervisor: project.supervisor || '',
      start_date: project.start_date ? new Date(project.start_date) : null,
      presupuesto_total: project.presupuesto_total || 0,
      presupuesto_ejecutado: project.presupuesto_ejecutado || 0
    });
  }

  cancelEdit(): void {
    this.editingProject = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.valid && this.editingProject) {
      const formValue = this.editForm.value;
      const updates = {
        name: formValue.name,
        location: formValue.location,
        contractor: formValue.contractor,
        supervisor: formValue.supervisor,
        start_date: formValue.start_date ? formValue.start_date.toISOString().split('T')[0] : null,
        presupuesto_total: formValue.presupuesto_total,
        presupuesto_ejecutado: formValue.presupuesto_ejecutado
      };
      
      this.projectsService.updateProject(this.editingProject.id, updates).subscribe({
        next: () => {
          this.loadProjects();
          this.cancelEdit();
          this.showMessage('Obra actualizada exitosamente', 'success');
        },
        error: (error) => {
          // Error updating project
          this.showMessage('Error al actualizar la obra', 'error');
        }
      });
    }
  }

  deleteProject(project: Project): void {
    const confirmed = this.showConfirmDialog(
      `¿Está seguro de eliminar la obra "${project.name}"?`,
      'Esta acción eliminará también todos los reportes asociados y no se puede deshacer.'
    );
    
    if (confirmed) {
      this.projectsService.deleteProject(project.id).subscribe({
        next: () => {
          this.loadProjects();
          this.showMessage('Obra eliminada exitosamente', 'success');
        },
        error: (error) => {
          // Error deleting project
          this.showMessage('Error al eliminar la obra', 'error');
        }
      });
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  }

  formatCurrency(amount: number | null | undefined): string {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getProgressPercentage(executed: number | null | undefined, total: number | null | undefined): number {
    if (!executed || !total || total === 0) return 0;
    return Math.round((executed / total) * 100);
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
    });
  }

  private showConfirmDialog(title: string, message: string): boolean {
    return confirm(`${title}\n\n${message}`);
  }
}