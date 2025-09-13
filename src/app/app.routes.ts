import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sistema de Gestión - Iniciar Sesión'
  },
  // Removed registration route as part of migration to Angular standalone
  
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    title: 'Dashboard - Sistema de Gestión de Rendimiento'
  },
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main.component').then(m => m.MainComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['residente'] },
    title: 'Generador de Reportes por Partida'
  },
  {
    path: 'actividades',
    loadComponent: () => import('./pages/actividades/actividades.component').then(m => m.ActividadesComponent),
    canActivate: [AuthGuard],
    title: 'Registro de Actividades'
  },
  {
    path: 'actividades/nueva',
    loadComponent: () => import('./pages/actividades/nueva-actividad/nueva-actividad.component').then(m => m.NuevaActividadComponent),
    canActivate: [AuthGuard],
    title: 'Nueva Actividad'
  },
  {
    path: 'actividades/editar/:id',
    loadComponent: () => import('./pages/actividades/editar-actividad/editar-actividad.component').then(m => m.EditarActividadComponent),
    canActivate: [AuthGuard],
    title: 'Editar Actividad'
  },
  {
    path: 'actividades/:id',
    loadComponent: () => import('./pages/actividades/detalle-actividad/detalle-actividad.component').then(m => m.DetalleActividadComponent),
    canActivate: [AuthGuard],
    title: 'Detalle de Actividad'
  },
  {
    path: 'mapa',
    loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent),
    canActivate: [AuthGuard],
    title: 'Mapa de Frentes'
  },
  {
    path: 'frentes',
    loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent),
    canActivate: [AuthGuard],
    title: 'Gestión de Frentes'
  },
  {
    path: 'frentes/nuevo',
    loadComponent: () => import('./components/frente-form/frente-form.component').then(m => m.FrenteFormComponent),
    canActivate: [AuthGuard],
    title: 'Crear Nuevo Frente'
  },
  {
     path: 'frentes/:id/editar',
     loadComponent: () => import('./components/frente-edit/frente-edit.component').then(m => m.FrenteEditComponent),
     canActivate: [AuthGuard],
     title: 'Editar Frente'
   },
   {
    path: 'evaluaciones',
    loadComponent: () => import('./pages/evaluaciones/evaluaciones.component').then(m => m.EvaluacionesComponent),
    canActivate: [AuthGuard],
    title: 'Evaluaciones de Personal'
  },
  {
    path: 'evaluaciones/nueva',
    loadComponent: () => import('./pages/evaluaciones/nueva-evaluacion/nueva-evaluacion.component').then(m => m.NuevaEvaluacionComponent),
    canActivate: [AuthGuard],
    title: 'Nueva Evaluación'
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [AuthGuard],
    title: 'Reportes y Analytics'
  },
  {
    path: 'reportes/exportar',
    loadComponent: () => import('./pages/reportes/exportar/exportar.component').then(m => m.ExportarComponent),
    canActivate: [AuthGuard],
    title: 'Exportar Reportes'
  },

  {
    path: 'generation',
    loadComponent: () => import('./pages/generation/generation.component').then(m => m.GenerationComponent),
    canActivate: [AuthGuard],
    title: 'Generación de Reportes'
  },
  {
    path: 'partidas',
    loadComponent: () => import('./pages/admin-items/admin-items.component').then(m => m.AdminItemsComponent),
    canActivate: [AuthGuard],
    title: 'Administración de Partidas'
  },
  {
    path: 'obras',
    loadComponent: () => import('./pages/obras/obras.component').then(m => m.ObrasComponent),
    canActivate: [AuthGuard],
    title: 'Gestión de Obras'
  },
  {
    path: 'obras/:id',
    loadComponent: () => import('./pages/obras/detalle-obra/detalle-obra.component').then(m => m.DetalleObraComponent),
    canActivate: [AuthGuard],
    title: 'Configuración de Obra'
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [AuthGuard],
    title: 'Perfil de Usuario'
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [AuthGuard],
    title: 'Gestión de Usuarios'
  },
  {
    path: 'kpis',
    loadComponent: () => import('./pages/kpis/kpis.component').then(m => m.KpisComponent),
    canActivate: [AuthGuard],
    title: 'Gestión de KPIs'
  },
  {
    path: 'admin-projects',
    loadComponent: () => import('./pages/admin-projects/admin-projects.component').then(m => m.AdminProjectsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['administrador', 'logistica'] },
    title: 'Administración de Obras'
  },

  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuration/configuration.component').then(m => m.ConfigurationComponent),
    canActivate: [AuthGuard],
    title: 'Configuración'
  },
  {
    path: 'debug',
    loadComponent: () => import('./components/debug/debug.component').then(m => m.DebugComponent),
    canActivate: [AuthGuard],
    title: 'Diagnóstico de Debug'
  },
  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
