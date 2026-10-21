import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { GlobalAuthService } from '../../Services/global-auth-service';

/**
 * Guard source type
 */
export enum GuardSourceType {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Configuration for guard behavior
 */
interface GuardConfig {
  source: GuardSourceType;
  loginRoute: string;
  logPrefix: string;
}

/**
 * GuardManager - Handles authentication checks for a specific source
 * This class is reused for both user and admin guards to eliminate code duplication
 */
class GuardManager {
  private config: GuardConfig;

  constructor(
    source: GuardSourceType,
    private globalAuthService: GlobalAuthService,
    private router: Router
  ) {
    this.config = this.getGuardConfig(source);
  }

  /**
   * Get configuration for the guard source
   */
  private getGuardConfig(source: GuardSourceType): GuardConfig {
    const configs: Record<GuardSourceType, GuardConfig> = {
      [GuardSourceType.USER]: {
        source: GuardSourceType.USER,
        loginRoute: '/home/login',
        logPrefix: '🔐 AuthGuard',
      },
      [GuardSourceType.ADMIN]: {
        source: GuardSourceType.ADMIN,
        loginRoute: '/admin/login',
        logPrefix: '🔐 AdminAuthGuard',
      },
    };
    return configs[source];
  }


  /**
   * Check if user can activate the route
   */
  // async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
  //   console.log(`${this.config.logPrefix}: canActivate called for route:`, state.url);

  //   // Check if running on server or client
  //   const isServer = typeof window === 'undefined';
  //   console.log(`${this.config.logPrefix}: Running on`, isServer ? 'SERVER' : 'CLIENT');

  //   // If SSR is disabled for this route and we're on the server, allow rendering
  //   // The client will do the actual auth check after hydration
  //   if (route.data['ssr'] === false && isServer) {
  //     console.log(`${this.config.logPrefix}: SSR disabled for this route on server, allowing render (client will verify)`);
  //     return true;
  //   }

  //   try {
  //     // Give auth service time to restore state from sessionStorage (client-side only)
  //     if (!isServer) {
  //       await new Promise(resolve => setTimeout(resolve, 0));
  //     }

  //     const isLoggedIn = this.getIsLoggedIn();
  //     const isTokenExpired = this.getIsTokenExpired();

  //     console.log(`${this.config.logPrefix}: isLoggedIn =`, isLoggedIn, ', isTokenExpired =', isTokenExpired);

  //     if (isLoggedIn && !isTokenExpired) {
  //       console.log(`✅ ${this.config.logPrefix}: Access GRANTED`);
  //       return true;
  //     }

  //     console.warn(`❌ ${this.config.logPrefix}: Access DENIED - redirecting to login`);
  //     this.router.navigate([this.config.loginRoute]);
  //     return false;
  //   } catch (error) {
  //     console.error(`❌ ${this.config.logPrefix}: Error in canActivate:`, error);
  //     this.router.navigate([this.config.loginRoute]);
  //     return false;
  //   }
  // }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const success = this.getIsLoggedIn() && !this.getIsTokenExpired();
    console.log(`${this.config.logPrefix}: canActivate result for route ${state.url} - isLoggedIn: ${this.getIsLoggedIn()}, isTokenExpired: ${this.getIsTokenExpired()}, access ${success ? 'GRANTED' : 'DENIED'}`);
    if (!success) {
      return this.router.createUrlTree([this.config.loginRoute]);
    }
    return success;
  }

  /**
   * Get login status based on source
   */
  private getIsLoggedIn(): boolean {
    if (this.config.source === GuardSourceType.USER) {
      return this.globalAuthService.userSourceIsLoggedIn();
    } else {
      return this.globalAuthService.adminSourceIsLoggedIn();
    }
  }

  /**
   * Get token expiration status based on source
   */
  private getIsTokenExpired(): boolean {
    if (this.config.source === GuardSourceType.USER) {
      return this.globalAuthService.isUserSourceTokenExpired();
    } else {
      return this.globalAuthService.isAdminSourceTokenExpired();
    }
  }
}

/**
 * GlobalAuthGuard - Unified authentication guard for both user and admin routes
 * Eliminates code duplication by using GuardManager for both sources
 *
 * Usage in routing:
 * - User routes: canActivate: [GlobalAuthGuard], data: { guardSource: 'user' }
 * - Admin routes: canActivate: [GlobalAuthGuard], data: { guardSource: 'admin' }
 *
 * Or use the specialized guards below for convenience
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalAuthGuard implements CanActivate {
  constructor(private globalAuthService: GlobalAuthService, private router: Router) {
    console.log('🔐 GlobalAuthGuard: Constructor called - Guard initialized');
  }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    // Determine source from route data, default to user
    const guardSource = (route.data['guardSource'] as GuardSourceType) || GuardSourceType.USER;

    const guardManager = new GuardManager(guardSource, this.globalAuthService, this.router);
    return guardManager.canActivate(route, state);
  }
}

/**
 * UserAuthGuard - Convenience guard for user routes
 * Automatically uses USER source
 *
 * Usage: canActivate: [UserAuthGuard]
 */
// @Injectable({
//   providedIn: 'root',
// })
// export class UserAuthGuard implements CanActivate {
//   constructor(private globalAuthService: GlobalAuthService, private router: Router) {
//     console.log('🔐 UserAuthGuard: Constructor called - Guard initialized');
//   }

//   async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
//     const guardManager = new GuardManager(GuardSourceType.USER, this.globalAuthService, this.router);
//     return guardManager.canActivate(route, state);
//   }
// }

// /**
//  * AdminAuthGuard - Convenience guard for admin routes
//  * Automatically uses ADMIN source
//  *
//  * Usage: canActivate: [AdminAuthGuard]
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class AdminAuthGuard implements CanActivate {
//   constructor(private globalAuthService: GlobalAuthService, private router: Router) {
//     console.log('🔐 AdminAuthGuard: Constructor called - Guard initialized');
//   }

//   async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
//     const guardManager = new GuardManager(GuardSourceType.ADMIN, this.globalAuthService, this.router);
//     return guardManager.canActivate(route, state);
//   }
// }
