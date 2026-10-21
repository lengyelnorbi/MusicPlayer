import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { GlobalAuthService } from '../../Services/global-auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  // const authService = inject(AuthService);
  // const adminAuthService = inject(AdminAuthService); 
  const globalAuthService = inject(GlobalAuthService);

  // Clone request to add credentials
  const reqWithCredentials = req.clone({
    withCredentials: true // Include cookies in all requests
  });
  console.log('AuthInterceptor: Adding withCredentials to request for URL:', req.credentials);


  // Tokens are sent via httpOnly cookies automatically by the browser
  // No need to manually add Authorization header
  return next(reqWithCredentials).pipe(
    catchError(error => {
      // Handle 401 Unauthorized responses
      if (error.status === 401) {
        console.warn('Unauthorized: Token expired or invalid');
        // Only clear cookies in browser environment
        if (typeof document !== 'undefined') {
          document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "adminRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "userToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "userRefreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
        if(router.url.startsWith('/admin')) {
          globalAuthService.adminSourceLogout();
          router.navigate(['/admin/login']);
          console.log('AuthInterceptor: Redirecting to admin login due to 401');
        } 
        else {
          globalAuthService.userSourceLogout();
          router.navigate(['/music-player/login']);
          console.log('AuthInterceptor: Redirecting to user login due to 401');
        }
      }
      return throwError(() => error);
    })
  );
};