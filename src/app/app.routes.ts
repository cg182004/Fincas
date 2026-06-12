import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'servicios',
    loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage)
  },
  {
    path: 'ubicacion',
    loadComponent: () => import('./pages/ubicacion/ubicacion.page').then(m => m.UbicacionPage)
  },
  {
    path: 'resumen',
    loadComponent: () => import('./pages/resumen/resumen.page').then(m => m.ResumenPage)
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
  },
  {
   path: 'finca',
   loadComponent: () => import('./components/finca/finca.component').then(m => m.FincaComponent)
  },
  {
   path: 'finca/:id',
   loadComponent: () => import('./components/finca/finca.component').then(m => m.FincaComponent)
  },
  {
   path: 'planes/:id',
   loadComponent: () => import('./components/plan-detalle/plan-detalle.component').then(m => m.PlanDetalleComponent)
  },
  {
   path: 'tareas',
   loadComponent: () => import('./components/gestionar-tareas/gestionar-tareas.component').then(m => m.GestionarTareasComponent)
  }
];
