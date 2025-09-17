import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { DirectAuthGuard } from './guards/direct-auth.guard';
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
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Registro - Sistema de Gestión'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [DirectAuthGuard],
    title: 'Dashboard - Sistema de Gestión de Rendimiento'
  },
  {
    path: 'main',
    loadComponent: () => import('./pages/main/main.component').then(m => m.MainComponent),
    canActivate: [DirectAuthGuard, RoleGuard],
    data: { roles: ['residente'] },
    title: 'Generador de Reportes por Partida'
  },
  {
    path: 'actividades',
    loadComponent: () => import('./pages/actividades/actividades.component').then(m => m.ActividadesComponent),
    canActivate: [DirectAuthGuard],
    title: 'Registro de Actividades'
  },
  {
    path: 'actividades/nueva',
    loadComponent: () => import('./pages/actividades/nueva-actividad/nueva-actividad.component').then(m => m.NuevaActividadComponent),
    canActivate: [DirectAuthGuard],
    title: 'Nueva Actividad'
  },
  {
    path: 'actividades/editar/:id',
    loadComponent: () => import('./pages/actividades/editar-actividad/editar-actividad.component').then(m => m.EditarActividadComponent),
    canActivate: [DirectAuthGuard],
    title: 'Editar Actividad'
  },
  {
    path: 'actividades/:id',
    loadComponent: () => import('./pages/actividades/detalle-actividad/detalle-actividad.component').then(m => m.DetalleActividadComponent),
    canActivate: [DirectAuthGuard],
    title: 'Detalle de Actividad'
  },
  {
    path: 'mapa',
    loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent),
    canActivate: [DirectAuthGuard],
    title: 'Mapa de Frentes'
  },
  {
    path: 'frentes',
    loadComponent: () => import('./pages/mapa/mapa.component').then(m => m.MapaComponent),
    canActivate: [DirectAuthGuard],
    title: 'Gestión de Frentes'
  },
  {
    path: 'frentes/nuevo',
    loadComponent: () => import('./components/frente-form/frente-form.component').then(m => m.FrenteFormComponent),
    canActivate: [DirectAuthGuard],
    title: 'Crear Nuevo Frente'
  },
  {
     path: 'frentes/:id/editar',
     loadComponent: () => import('./components/frente-edit/frente-edit.component').then(m => m.FrenteEditComponent),
     canActivate: [DirectAuthGuard],
     title: 'Editar Frente'
   },
   {
    path: 'evaluaciones',
    loadComponent: () => import('./pages/evaluaciones/evaluaciones.component').then(m => m.EvaluacionesComponent),
    canActivate: [DirectAuthGuard],
    title: 'Evaluaciones de Personal'
  },
  {
    path: 'evaluaciones/nueva',
    loadComponent: () => import('./pages/evaluaciones/nueva-evaluacion/nueva-evaluacion.component').then(m => m.NuevaEvaluacionComponent),
    canActivate: [DirectAuthGuard],
    title: 'Nueva Evaluación'
  },
  {
    path: 'reportes',
    loadComponent: () => import('./pages/reportes/reportes.component').then(m => m.ReportesComponent),
    canActivate: [DirectAuthGuard],
    title: 'Reportes y Analytics'
  },
  {
    path: 'reportes/exportar',
    loadComponent: () => import('./pages/reportes/exportar/exportar.component').then(m => m.ExportarComponent),
    canActivate: [DirectAuthGuard],
    title: 'Exportar Reportes'
  },

  {
    path: 'generation',
    loadComponent: () => import('./pages/generation/generation.component').then(m => m.GenerationComponent),
    canActivate: [DirectAuthGuard],
    title: 'Generación de Reportes'
  },
  {
    path: 'partidas',
    loadComponent: () => import('./pages/admin-items/admin-items.component').then(m => m.AdminItemsComponent),
    canActivate: [DirectAuthGuard],
    title: 'Administración de Partidas'
  },
  {
    path: 'obras',
    loadComponent: () => import('./pages/obras/obras.component').then(m => m.ObrasComponent),
    canActivate: [DirectAuthGuard],
    title: 'Gestión de Obras'
  },
  {
    path: 'obras/:id',
    loadComponent: () => import('./pages/obras/detalle-obra/detalle-obra.component').then(m => m.DetalleObraComponent),
    canActivate: [DirectAuthGuard],
    title: 'Configuración de Obra'
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.component').then(m => m.PerfilComponent),
    canActivate: [DirectAuthGuard],
    title: 'Perfil de Usuario'
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.component').then(m => m.UsuariosComponent),
    canActivate: [DirectAuthGuard],
    title: 'Gestión de Usuarios'
  },
  {
    path: 'kpis',
    loadComponent: () => import('./pages/kpis/kpis.component').then(m => m.KpisComponent),
    canActivate: [DirectAuthGuard],
    title: 'Gestión de KPIs'
  },
  {
    path: 'dashboard-kilometrico',
    loadComponent: () => import('./components/dashboard-kilometrico/dashboard-kilometrico.component').then(m => m.DashboardKilometricoComponent),
    canActivate: [DirectAuthGuard]
  },
  {
    path: 'admin-projects',
    loadComponent: () => import('./pages/admin-projects/admin-projects.component').then(m => m.AdminProjectsComponent),
    canActivate: [DirectAuthGuard, RoleGuard],
    data: { roles: ['administrador', 'logistica'] },
    title: 'Administración de Obras'
  },

  {
    path: 'configuracion',
    loadComponent: () => import('./pages/configuration/configuration.component').then(m => m.ConfigurationComponent),
    canActivate: [DirectAuthGuard],
    title: 'Configuración'
  },

  {
    path: '**',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  }
];
