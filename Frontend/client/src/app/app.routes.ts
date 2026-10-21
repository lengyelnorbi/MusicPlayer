import { Routes } from '@angular/router';
import { LoginRedirectGuard } from './Shared/Guards/login-redirect-guard';
import { LanguageGuard } from './Shared/Guards/language-guard';
import { GlobalAuthGuard } from './Shared/Guards/global-auth-guard';
import { AdminMain } from './Admin/Components/admin-main/admin-main';
import { Main } from './MusicPlayer/Components/main/main';
import { MusicList } from './MusicPlayer/Components/music-list/music-list';
import { Playlist } from './MusicPlayer/Components/playlist/playlist';
import { MusicPlayerLogin } from './Login/Components/music-player-login/music-player-login';
import { Settings } from './MusicPlayer/Components/settings/settings';

export const routes: Routes = [
    // Default route
    { path: '', redirectTo: ':lang/home/music-player', pathMatch: 'full' },

    {
      path: ':lang/home',
      component: Main,
      canActivate: [LanguageGuard],
      children: [
        { path: '', redirectTo: 'music-player', pathMatch: 'full' },
        { path: 'music-player', component: MusicList },
        { path: 'playlists', component: Playlist, canActivate: [GlobalAuthGuard], data: { guardSource: 'user' } },
        { path: 'playlists/:id', component: Playlist, canActivate: [GlobalAuthGuard], data: { guardSource: 'user' } },
        { path: 'login', component: MusicPlayerLogin, canActivate: [LoginRedirectGuard] },
        { path: 'settings', component: Settings }
      ]
    },

    {
      path: 'home',
      component: Main,
      canActivate: [LanguageGuard],
      children: [
        { path: '', redirectTo: 'music-player', pathMatch: 'full' },
        { path: 'music-player', component: MusicList },
        { path: 'playlists', component: Playlist, canActivate: [GlobalAuthGuard], data: { guardSource: 'user' } },
        { path: 'playlists/:id', component: Playlist, canActivate: [GlobalAuthGuard], data: { guardSource: 'user' } },
        { path: 'login', component: MusicPlayerLogin, canActivate: [LoginRedirectGuard] },
        { path: 'settings', component: Settings }
      ]
    },

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
    { path: 'admin/login', canActivate: [LoginRedirectGuard], loadComponent: () => import('./Login/Components/admin-login/admin-login').then(m => m.AdminLogin), data: { source: 'admin' } },
    { path: 'admin', redirectTo: 'admin/login', pathMatch: 'full' },
    // {path : 'admin/dashboard', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/music', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/user', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/token', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
    // {path : 'admin/settings', canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }, loadComponent: () => import('./Admin/Components/admin-main/admin-main').then(m => m.AdminMain)},
];