import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-report-generator',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    RouterModule
  ],
  templateUrl: './report-generator.component.html',
  styleUrls: ['./report-generator.component.scss']
})
export class ReportGeneratorComponent {
  @Input() tiposReporte: {id: string, nombre: string, descripcion: string, icono: string}[] = [
    {
      id: 'rendimiento',
      nombre: 'Rendimiento',
      descripcion: 'Reporte detallado del rendimiento por obra y frente',
      icono: 'trending_up'
    },
    {
      id: 'personal',
      nombre: 'Personal',
      descripcion: 'Evaluaciones y desempeño del personal',
      icono: 'people'
    },
    {
      id: 'actividades',
      nombre: 'Actividades',
      descripcion: 'Estado y progreso de actividades por obra',
      icono: 'assignment'
    },
    {
      id: 'kpis',
      nombre: 'KPIs',
      descripcion: 'Indicadores clave de rendimiento consolidados',
      icono: 'insights'
    }
  ];

  @Output() generarReporte = new EventEmitter<string>();

  constructor() {}

  onGenerarReporte(tipoId: string): void {
    this.generarReporte.emit(tipoId);
  }
}