import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AdminAuthService } from '../../Services/admin-auth-service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthGuard implements CanActivate {
  constructor(private adminAuthService: AdminAuthService, private router: Router) {
    console.log('🔐 AdminAuthGuard: Constructor called - Guard initialized');
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    console.log('🔐 AdminAuthGuard: canActivate called for route:', state.url);
    
    // Check if running on server or client
    const isServer = typeof window === 'undefined';
    console.log('🔐 AdminAuthGuard: Running on', isServer ? 'SERVER' : 'CLIENT');
    
    // If SSR is disabled for this route and we're on the server, allow rendering
    // The client will do the actual auth check after hydration
    if (route.data['ssr'] === false && isServer) {
      console.log('🔐 AdminAuthGuard: SSR disabled for this route on server, allowing render (client will verify)');
      return true;
    }
    
    try {
      // Give auth service time to restore state from sessionStorage (client-side only)
      if (!isServer) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      const isLoggedIn = this.adminAuthService.adminSourceIsLoggedIn();
      const isTokenExpired = this.adminAuthService.isAdminSourceTokenExpired();
      
      console.log('🔐 AdminAuthGuard: isLoggedIn =', isLoggedIn, ', isTokenExpired =', isTokenExpired);
      
      if (isLoggedIn && !isTokenExpired) {
        console.log('✅ AdminAuthGuard: Access GRANTED');
        return true;
      }

      console.warn('❌ AdminAuthGuard: Access DENIED - redirecting to login');
      this.router.navigate(['/admin/login']);
      return false;
    } catch (error) {
      console.error('❌ AdminAuthGuard: Error in canActivate:', error);
      this.router.navigate(['/admin/login']);
      return false;
    }
  }
}
