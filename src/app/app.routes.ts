import { Routes } from '@angular/router';
import { MainComponent } from './pages/main/main.component';
import { ConfigurationComponent } from './pages/configuration/configuration.component';
import { GenerationComponent } from './pages/generation/generation.component';
import { AdminItemsComponent } from './pages/admin-items/admin-items.component';

export const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    title: 'Sistema de Informes - Búsqueda de Partidas'
  },
  {
    path: 'configuration',
    component: ConfigurationComponent,
    title: 'Sistema de Informes - Configuración de Obra'
  },
  {
    path: 'generation',
    component: GenerationComponent,
    title: 'Sistema de Informes - Generación de Informe'
  },
  {
    path: 'admin-items',
    component: AdminItemsComponent,
    title: 'Sistema de Informes - Administración de Partidas'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
