import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
 private adminSourceIsAuthenticated = false;
  private adminSourceIsAdminUser = false;
  private adminSourceTokenExpiresAt: number | null = null;
  private adminSourceRefreshTimerId: any = null;
  private adminSourceRefreshTimerInitialized = false;
  private adminSourceLoggedInUsername: string | null = null;
  private adminSourceRefreshTokenExpiresAt: number | null = null;
  private adminSourceAutomaticLogoutTimerId: any = null;

  constructor(private router: Router, private apiConfig: ApiConfigService) {
    // Check if user was previously logged in
    this.checkAdminSourceAuthStatus();
  }

  async adminSourceLogin(email: string, password: string): Promise<void> {
    try {
      console.log('Starting login process for:', email);
      const endpoint = this.apiConfig.getEndpoint('/api/auth');
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include/send cookies
        body: JSON.stringify({ email: email, password: password, source: 'admin' }), // Indicate login source (user or admin)
      });

      const data = await response.json();
      console.log('Login response:', { ok: response.ok, data });
      
      if (response.ok && data.success) {
        console.log('Login successful');
        this.adminSourceIsAuthenticated = true;
        this.adminSourceIsAdminUser = data.user?.role === 'Admin';
        
        // Store token expiration
        const expiresInSeconds = data.expiresIn || 900; // Default to 15 minutes if not provided
        console.log('Token expires in:', expiresInSeconds, 'seconds');
        this.adminSourceTokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
        console.log('Token expires at:', new Date(this.adminSourceTokenExpiresAt).toISOString());

        const refreshTokenExpiresInSeconds = data.refreshTokenExpiresAt || 300;
        console.log('Refresh token expires in:', refreshTokenExpiresInSeconds, 'seconds');
        this.adminSourceRefreshTokenExpiresAt = Date.now() + (refreshTokenExpiresInSeconds * 1000);
        console.log('Refresh token expires at:', new Date(this.adminSourceRefreshTokenExpiresAt).toISOString());
        
        // Store in sessionStorage to survive page refresh (only in browser)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('adminSourceTokenExpiresAt', this.adminSourceTokenExpiresAt.toString());
          sessionStorage.setItem('adminSourceRefreshTokenExpiresAt', this.adminSourceRefreshTokenExpiresAt?.toString() || '');
          sessionStorage.setItem('adminSourceLoggedInUsername', data.user?.username || '');
        }
        
        // Start silent refresh timer
        this.startAdminSourceTokenRefreshTimer();
        console.log(this.adminSourceRefreshTokenExpiresAt?.toString() + ' - ' + this.adminSourceTokenExpiresAt.toString());
        this.adminSourceAutomaticLogoutOnTokenExpiration();
        console.log('Login process completed successfully');
      } else {
        console.error('Login failed:', data.error);
        this.adminSourceIsAuthenticated = false;
        this.adminSourceTokenExpiresAt = null;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('adminSourceTokenExpiresAt');
          sessionStorage.removeItem('adminSourceRefreshTokenExpiresAt');
          sessionStorage.removeItem('adminSourceLoggedInUsername');
        }
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      this.adminSourceIsAuthenticated = false;
      this.adminSourceTokenExpiresAt = null;
      this.adminSourceRefreshTokenExpiresAt = null;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('adminSourceTokenExpiresAt');
        sessionStorage.removeItem('adminSourceRefreshTokenExpiresAt');
        sessionStorage.removeItem('adminSourceLoggedInUsername');
      }
      throw error;
    }
  }

  private adminSourceAutomaticLogoutOnTokenExpiration(): void {
    console.log('Setting up automatic logout on token expiration' + (this.adminSourceRefreshTokenExpiresAt ? `(expires at ${new Date(this.adminSourceRefreshTokenExpiresAt).toISOString()})` : '(no expiration set)'));
    if (!this.adminSourceIsAuthenticated || !this.adminSourceTokenExpiresAt) {
      console.log('Not authenticated or no token expiration set, skipping automatic logout setup');
      return;
    }

    if (!this.adminSourceRefreshTokenExpiresAt){
      console.warn('No refresh token expiration set, cannot setup automatic logout');
      return;
    }

    const timeUntilExpiration = this.adminSourceRefreshTokenExpiresAt - Date.now() - 1000;
    console.log('Setting up automatic logout in', timeUntilExpiration / 1000, 'seconds');

     this.adminSourceAutomaticLogoutTimerId = setTimeout(() => {
      console.log('Token expired, performing automatic logout');
      this.adminSourceLogout();
    }, Math.max(0, timeUntilExpiration));

    console.log('Automatic logout timer ID:', this.adminSourceAutomaticLogoutTimerId);
  }

  private startAdminSourceTokenRefreshTimer(): void {
    if (!this.adminSourceIsAuthenticated) {
      console.log('Not authenticated, skipping timer setup');
      return;
    }
    
    if (!this.adminSourceTokenExpiresAt) return;
    
    console.log('startTokenRefreshTimer called. Current timer ID BEFORE assignment:', this.adminSourceRefreshTimerId);
    
    // Clear any existing timer
    if (this.adminSourceRefreshTimerId) {
      console.log('Clearing existing timer:', this.adminSourceRefreshTimerId);
      clearTimeout(this.adminSourceRefreshTimerId);
    }
    
    // Refresh 1 minute before expiration
    const timeUntilRefresh = this.adminSourceTokenExpiresAt - Date.now() - 20000; // Refresh 20 seconds before expiration for testing
    
    this.adminSourceRefreshTimerId = setTimeout(() => {
      console.log('Token refresh timer fired!');
      this.adminSourceSilentRefresh();
    }, Math.max(0, timeUntilRefresh));
    
    this.adminSourceRefreshTimerInitialized = true;
    console.log('Timer scheduled for', Math.max(0, timeUntilRefresh) / 1000, 'seconds. AFTER assignment, timer ID is:', this.adminSourceRefreshTimerId);
  }

  private async adminSourceSilentRefresh(): Promise<void> {
    try {
      console.log('Attempting silent token refresh...');
      console.log('Current token expires at:', this.adminSourceTokenExpiresAt ? new Date(this.adminSourceTokenExpiresAt).toISOString() : 'N/A');
      const endpoint = this.apiConfig.getEndpoint('/api/auth/refresh');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const expiresInSeconds = data.expiresIn || 900;
        this.adminSourceTokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
        
        // Update sessionStorage only in browser
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('adminSourceTokenExpiresAt', this.adminSourceTokenExpiresAt.toString());
        }
        
        this.adminSourceRefreshTimerInitialized = false; // Reset so we can initialize the next timer
        this.startAdminSourceTokenRefreshTimer(); // Restart timer
        console.log('Token refreshed silently, expires in:', expiresInSeconds, 'seconds');
      } else if(response.status === 401) {
        // Token expired or missing - stop trying to refresh
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 401:', errorData.error);
        this.adminSourceClearAuthState();
        this.router.navigate(['/admin/login']);
      } else if(response.status === 500) {
        // Server error - can't trust token validity, logout to prevent unauthorized access
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 500:', errorData.error);
        this.adminSourceClearAuthState();
        this.router.navigate(['/admin/login']);
      } else {
        // Any other error - treat as refresh failure, logout
        const data = await response.json().catch(() => ({}));
        console.warn('Silent refresh failed with status:', response.status, data.error || 'Unknown error');
        this.adminSourceClearAuthState();
        this.router.navigate(['/admin/login']);
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
      this.adminSourceClearAuthState();
      this.router.navigate(['/admin/login']);
    }
  }

  async adminSourceLogout(): Promise<void> {
    console.log('Logout called');
    console.trace();
    
    // Call backend logout if needed
    const endpoint = await this.apiConfig.getEndpoint('/api/auth/logout');
    fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      console.log('Logout successful');
      this.adminSourceClearAuthState();
      this.router.navigate(['/admin/login']);
    }).catch(err => console.error('Logout error:', err));
  }

  private adminSourceClearAuthState(): void {
    // Set this first so any callbacks won't try to setup new timers
    this.adminSourceIsAuthenticated = false;
    
    this.adminSourceIsAdminUser = false;
    this.adminSourceTokenExpiresAt = null;
    this.adminSourceRefreshTimerInitialized = false;
    
    // Clear timer
    if (this.adminSourceRefreshTimerId) {
      clearTimeout(this.adminSourceRefreshTimerId);
      this.adminSourceRefreshTimerId = null;
    }
    
    // Clear sessionStorage only in browser
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('adminSourceTokenExpiresAt');
      sessionStorage.removeItem('adminSourceLoggedInUsername');
    }
  }

  adminSourceIsLoggedIn(): boolean {
    return this.adminSourceIsAuthenticated;
  }

  adminSourceGetLoggedInUsername(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem('adminSourceLoggedInUsername');
  }
  
  isAdminSourceTokenExpired(): boolean {
    if (!this.adminSourceTokenExpiresAt) return true;
    console.log('Checking token expiration. Current time:', new Date().toISOString(), 'Token expires at:', new Date(this.adminSourceTokenExpiresAt).toISOString());
    return Date.now() > this.adminSourceTokenExpiresAt;
  }

  isAdmin(): boolean {
    return this.adminSourceIsAdminUser;
  }

  private checkAdminSourceAuthStatus(): void {
    // Only access sessionStorage in browser environment
    if (typeof sessionStorage === 'undefined') {
      console.log('checkAdminSourceAuthStatus: Running on server, sessionStorage unavailable');
      return;
    }

    // On app load, restore authentication state from sessionStorage
    const storedExpiresAt = sessionStorage.getItem('adminSourceTokenExpiresAt');
    console.log('checkAdminSourceAuthStatus: Checking sessionStorage for tokenExpiresAt:', storedExpiresAt);
    
    if (storedExpiresAt) {
      this.adminSourceTokenExpiresAt = parseInt(storedExpiresAt, 10);
      
      // Check if token is still valid
      if (Date.now() < this.adminSourceTokenExpiresAt) {
        this.adminSourceIsAuthenticated = true;
        console.log('✅ Session restored from sessionStorage, adminSourceIsAuthenticated set to true');
        console.log('Guard check: adminSourceRefreshTimerInitialized is', this.adminSourceRefreshTimerInitialized);
        // Only start timer if one hasn't been initialized yet (avoid duplicate timers)
        if (!this.adminSourceRefreshTimerInitialized) {
          console.log('Timer not initialized yet, starting new one');
          this.startAdminSourceTokenRefreshTimer();
          this.adminSourceAutomaticLogoutOnTokenExpiration();
        } else {
          console.log('Timer already initialized, skipping');
        }
      } else {
        // Token expired during page refresh
        console.log('❌ Token expired, clearing sessionStorage');
        sessionStorage.removeItem('adminSourceTokenExpiresAt');
        sessionStorage.removeItem('adminSourceLoggedInUsername');
        this.adminSourceIsAuthenticated = false;
      }
    } else {
      console.log('checkAdminSourceAuthStatus: No tokenExpiresAt in sessionStorage, user not authenticated');
    }
  }
}
