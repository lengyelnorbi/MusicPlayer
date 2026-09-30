import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { GlobalAuthService } from '../../Services/global-auth-service';


@Injectable({
  providedIn: 'root',
})
export class LoginRedirectGuard implements CanActivate {
  constructor(private globalAuth: GlobalAuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const source = route.data['source'] || 'user'; // Default to 'user' if not specified

    if(source === 'admin') {
      // If admin is logged in, redirect to admin dashboard
      if (this.globalAuth.adminSourceIsLoggedIn()) {
        this.router.navigate(['/admin/dashboard']);
        return false;
      }
    }

    // If user is logged in, redirect to music-player
    if (this.globalAuth.userSourceIsLoggedIn()) {
      this.router.navigate(['/hu/home/music-player']);
      return false;
    }
    
    // If not logged in, allow access to login page
    return true;
  }
}
