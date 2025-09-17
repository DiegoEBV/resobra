import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

import { ProjectsService } from '../../services/projects.service';
import { ReportsService } from '../../services/reports.service';
import { Project, Report, SelectedItem } from '../../models/interfaces';

@Component({
    selector: 'app-configuration',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDatepickerModule,
        MatNativeDateModule
    ],
    templateUrl: './configuration.component.html',
    styleUrl: './configuration.component.scss'
})
export class ConfigurationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Project data
  projects: Project[] = [];
  selectedProject: Project | null = null;
  isLoadingProjects = false;
  
  // New project form
  newProject: Partial<Project> = {
    name: '',
    location: '',
    contractor: '',
    supervisor: '',
    start_date: new Date().toISOString()
  };
  
  // Reports history
  reports: Report[] = [];
  isLoadingReports = false;
  displayedColumns: string[] = ['report_number', 'period_start', 'period_end', 'created_at', 'actions'];
  
  // Selected items from previous page
  selectedItems: SelectedItem[] = [];
  
  constructor(
    private projectsService: ProjectsService,
    private reportsService: ReportsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadSelectedItems();
    this.loadProjects();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadSelectedItems(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('selectedItems');
      console.log('DEBUG: Stored selectedItems:', stored);
      if (stored) {
        this.selectedItems = JSON.parse(stored);
        console.log('DEBUG: Parsed selectedItems:', this.selectedItems);
      }
    }
    
    console.log('DEBUG: Final selectedItems length:', this.selectedItems.length);
    if (this.selectedItems.length === 0) {
      this.snackBar.open('No hay partidas seleccionadas. Regresa a la página principal.', 'Cerrar', {
        duration: 5000
      });
    }
  }
  
  loadProjects(): void {
    this.isLoadingProjects = true;
    console.log('DEBUG: Loading projects...');
    this.projectsService.getAllProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (projects) => {
          this.projects = projects;
          console.log('DEBUG: Loaded projects:', projects);
          this.isLoadingProjects = false;
        },
        error: (error) => {
          // Error loading projects
          this.snackBar.open('Error al cargar proyectos', 'Cerrar', { duration: 3000 });
          this.isLoadingProjects = false;
        }
      });
  }
  
  onProjectChange(): void {
    if (this.selectedProject) {
      this.loadReportsHistory();
    } else {
      this.reports = [];
    }
  }
  
  loadReportsHistory(): void {
    if (!this.selectedProject) return;
    
    this.isLoadingReports = true;
    this.reportsService.getReportsByProject(this.selectedProject.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.reports = reports;
          this.isLoadingReports = false;
        },
        error: (error) => {
          // Error loading reports
          this.snackBar.open('Error al cargar historial de informes', 'Cerrar', { duration: 3000 });
          this.isLoadingReports = false;
        }
      });
  }
  
  createNewProject(): void {
    if (!this.newProject.name || !this.newProject.location) {
      this.snackBar.open('Completa todos los campos obligatorios', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.projectsService.createProject(this.newProject as Omit<Project, 'id' | 'created_at' | 'updated_at'>)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project) => {
          this.projects.push(project);
          this.selectedProject = project;
          this.newProject = {
            name: '',
            location: '',
            contractor: '',
            supervisor: '',
            start_date: new Date().toISOString()
          };
          this.snackBar.open('Proyecto creado exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          // Error creating project
          this.snackBar.open('Error al crear proyecto', 'Cerrar', { duration: 3000 });
        }
      });
  }
  
  viewReport(report: Report): void {
    // Navigate to generation page with report data
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('editingReport', JSON.stringify(report));
    }
    this.router.navigate(['/generation']);
  }
  
  deleteReport(report: Report): void {
    if (confirm('¿Estás seguro de que deseas eliminar este informe?')) {
      this.reportsService.deleteReport(report.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.reports = this.reports.filter(r => r.id !== report.id);
            this.snackBar.open('Informe eliminado exitosamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            // Error deleting report
            this.snackBar.open('Error al eliminar informe', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }
  
  canContinue(): boolean {
    const canContinue = this.selectedProject !== null && this.selectedItems.length > 0;
    console.log('DEBUG: canContinue() - selectedProject:', this.selectedProject);
    console.log('DEBUG: canContinue() - selectedItems.length:', this.selectedItems.length);
    console.log('DEBUG: canContinue() result:', canContinue);
    return canContinue;
  }
  
  continueToGeneration(): void {
    console.log('DEBUG: continueToGeneration() called');
    if (!this.canContinue()) {
      console.log('DEBUG: Cannot continue - showing error message');
      this.snackBar.open('Selecciona un proyecto para continuar', 'Cerrar', { duration: 3000 });
      return;
    }
    
    console.log('DEBUG: Continuing to generation with project:', this.selectedProject);
    // Store selected project for next page
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedProject', JSON.stringify(this.selectedProject));
    }
    console.log('DEBUG: Navigating to /generation');
    this.router.navigate(['/generation']);
  }
  
  goBack(): void {
    this.router.navigate(['/']);
  }
}
