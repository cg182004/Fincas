import { Routes } from '@angular/router';
import { profileGuard } from './guards/profile.guard';

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
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/home/home.page').then( m => m.HomePage)
  },
  {
    path: 'servicios',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/servicios/servicios.page').then(m => m.ServiciosPage)
  },
  {
    path: 'articulos',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/articulos/articulos.page').then(m => m.ArticulosPage)
  },
  {
    path: 'catalogo-fincas',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/catalogo-fincas/catalogo-fincas.page').then(m => m.CatalogoFincasPage)
  },
  {
    path: 'recomendaciones',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/recomendaciones/recomendaciones.page').then(m => m.RecomendacionesPage)
  },
  {
    path: 'ubicacion',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/ubicacion/ubicacion.page').then(m => m.UbicacionPage)
  },
  {
    path: 'resumen',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/resumen/resumen.page').then(m => m.ResumenPage)
  },
  {
    path: 'perfil',
    canActivate: [profileGuard],
    loadComponent: () => import('./pages/perfil/perfil.page').then(m => m.PerfilPage)
  },
  {
    path: 'completar-perfil',
    loadComponent: () => import('./pages/completar-perfil/completar-perfil.page').then(m => m.CompletarPerfilPage)
  },
  {
   path: 'finca',
   canActivate: [profileGuard],
   loadComponent: () => import('./components/finca/finca.component').then(m => m.FincaComponent)
  },
  {
   path: 'finca/:id',
   canActivate: [profileGuard],
   loadComponent: () => import('./components/finca/finca.component').then(m => m.FincaComponent)
  },
  {
   path: 'planes/:id',
   canActivate: [profileGuard],
   loadComponent: () => import('./components/plan-detalle/plan-detalle.component').then(m => m.PlanDetalleComponent)
  },
  {
   path: 'tareas',
   canActivate: [profileGuard],
   loadComponent: () => import('./components/gestionar-tareas/gestionar-tareas.component').then(m => m.GestionarTareasComponent)
  }
];
