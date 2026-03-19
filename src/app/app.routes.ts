import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/layout.component/layout.component')
      .then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component/dashboard.component')
          .then(m => m.DashboardComponent)
      },
      {
        path: 'empresas',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/empresa/empresa-list/empresa-list.component')
          .then(m => m.EmpresaListComponent)
      },
      {
        path: 'pastas',
        loadComponent: () => import('./components/pasta/pasta-list/pasta-list.component')
          .then(m => m.PastaListComponent)
      },
      {
        path: 'arquivos',
        loadComponent: () => import('./components/arquivo/arquivo-list/arquivo-list.component')
          .then(m => m.ArquivoListComponent)
      },
      {
        path: 'usuarios',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/usuario/usuario-list/usuario-list.component')
          .then(m => m.UsuarioListComponent)
      },
      {
        path: 'socios',
        canActivate: [adminGuard],
        loadComponent: () => import('./components/socio/socio-list/socio-list.component')
          .then(m => m.SocioListComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];