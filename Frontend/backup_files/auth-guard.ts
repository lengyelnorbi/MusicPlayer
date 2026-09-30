import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../Services/auth-service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {
    console.log('🔐 AuthGuard: Constructor called - Guard initialized');
  }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    console.log('🔐 AuthGuard: canActivate called for route:', state.url);
    
    // Check if running on server or client
    const isServer = typeof window === 'undefined';
    console.log('🔐 AuthGuard: Running on', isServer ? 'SERVER' : 'CLIENT');
    
    // If SSR is disabled for this route and we're on the server, allow rendering
    // The client will do the actual auth check after hydration
    if (route.data['ssr'] === false && isServer) {
      console.log('🔐 AuthGuard: SSR disabled for this route on server, allowing render (client will verify)');
      return true;
    }
    
    try {
      // Give auth service time to restore state from sessionStorage (client-side only)
      if (!isServer) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      const isLoggedIn = this.authService.userSourceIsLoggedIn();
      const isTokenExpired = this.authService.isUserSourceTokenExpired();
      
      console.log('🔐 AuthGuard: isLoggedIn =', isLoggedIn, ', isTokenExpired =', isTokenExpired);
      
      if (isLoggedIn && !isTokenExpired) {
        console.log('✅ AuthGuard: Access GRANTED');
        return true;
      }

      console.warn('❌ AuthGuard: Access DENIED - redirecting to login');
      this.router.navigate(['/home/login']);
      return false;
    } catch (error) {
      console.error('❌ AuthGuard: Error in canActivate:', error);
      this.router.navigate(['/home/login']);
      return false;
    }
  }
}
