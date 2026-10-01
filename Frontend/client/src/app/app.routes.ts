import { Routes } from '@angular/router';
import { LoginRedirectGuard } from './Shared/Guards/login-redirect-guard';
import { LanguageGuard } from './Shared/Guards/language-guard';
import { GlobalAuthGuard } from './Shared/Guards/global-auth-guard';
import { AdminMain } from './Admin/Components/admin-main/admin-main';

export const routes: Routes = [
    // Default route
    {path : '', redirectTo : ':lang/home/music-player', pathMatch: 'full'},
    
    // Main music player with language support
    {
      path : ':lang/home/music-player',
      loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main),
      canActivate: [LanguageGuard]
    },

    // Playlists route with language support
    {
      path : ':lang/home/playlists',
      loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main),
      canActivate: [GlobalAuthGuard], data: { guardSource: 'user' }
    },
    {
      path : ':lang/home/playlists/:id',
      loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main),
      canActivate: [GlobalAuthGuard], data: { guardSource: 'user' }
    },
    
    // Login route with language support
    {
      path : ':lang/home/login',
      loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main),
      canActivate: [LoginRedirectGuard, LanguageGuard]
    },
    // Settings route with language support
    {
      path : ':lang/home/settings',
      loadComponent: () => import('./MusicPlayer/Components/settings/settings').then(m => m.Settings),
      canActivate: [LanguageGuard]
    },
    
    // Fallback routes without language (will redirect via LanguageGuard)
    {path : 'home/music-player', canActivate: [LanguageGuard], loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main)},
    {path : 'home/playlists', canActivate: [GlobalAuthGuard], data: { guardSource: 'user' }, loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main)},
    {path : 'home/login', canActivate: [LoginRedirectGuard, LanguageGuard], loadComponent: () => import('./MusicPlayer/Components/main/main').then(m => m.Main), data: { source: 'user' }},
    
    // Admin routes
    {
      path: 'admin',
      canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' },
      component: AdminMain,
      children: [
        {
          path: 'dashboard',
          loadComponent: () => import('./Admin/Components/dashboard/dashboard')
            .then(m => m.Dashboard)
        },
        {
          path: 'music',
          loadComponent: () => import('./Admin/Components/admin-music/admin-music')
            .then(m => m.AdminMusic)
        },
        {
          path: 'user',
          loadComponent: () => import('./Admin/Components/admin-user/admin-user')
            .then(m => m.AdminUser)
        },
        {
          path: 'token',
          loadComponent: () => import('./Admin/Components/token/token')
            .then(m => m.Token)
        }
      ]
    },
    {path : 'admin/login', canActivate: [LoginRedirectGuard], loadComponent: () => import('./Login/Components/admin-login/admin-login').then(m => m.AdminLogin), data: { source: 'admin' }},
    {path : 'admin', redirectTo : 'admin/login', pathMatch: 'full'},
    // {path : 'admin/dashboard', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/music', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/user', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/token', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/settings', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
];