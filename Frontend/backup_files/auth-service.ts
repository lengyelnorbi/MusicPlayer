import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userSourceIsAuthenticated = false;
  private userSourceIsAdminUser = false;
  private userSourceTokenExpiresAt: number | null = null;
  private userSourceRefreshTimerId: any = null;
  private userSourceRefreshTimerInitialized = false;
  private userSourceLoggedInUsername: string | null = null;
  private userSourceRefreshTokenExpiresAt: number | null = null;
  private userSourceAutomaticLogoutTimerId: any = null;

  constructor(private router: Router, private apiConfig: ApiConfigService) {
    // Check if user was previously logged in
    this.checkUserSourceAuthStatus();
  }

  async userSourceLogin(email: string, password: string): Promise<void> {
    try {
      console.log('Starting login process for:', email);
      const endpoint = this.apiConfig.getEndpoint('/api/auth');
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include/send cookies
        body: JSON.stringify({ email: email, password: password, source: 'user' }), // Indicate login source (user or admin)
      });

      const data = await response.json();
      console.log('Login response:', { ok: response.ok, data });
      
      if (response.ok && data.success) {
        console.log('Login successful');
        this.userSourceIsAuthenticated = true;
        this.userSourceIsAdminUser = data.user?.role === 'Admin';
        
        // Store token expiration
        const expiresInSeconds = data.expiresIn || 900; // Default to 15 minutes if not provided
        console.log('Token expires in:', expiresInSeconds, 'seconds');
        this.userSourceTokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
        console.log('Token expires at:', new Date(this.userSourceTokenExpiresAt).toISOString());

        
        const refreshTokenExpiresInSeconds = data.refreshTokenExpiresAt || 300;
        console.log('Refresh token expires in:', refreshTokenExpiresInSeconds, 'seconds');
        this.userSourceRefreshTokenExpiresAt = Date.now() + (refreshTokenExpiresInSeconds * 1000);
        console.log('Refresh token expires at:', new Date(this.userSourceRefreshTokenExpiresAt).toISOString());
        
        // Store in sessionStorage to survive page refresh (only in browser)
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('userSourceTokenExpiresAt', this.userSourceTokenExpiresAt.toString());
          sessionStorage.setItem('userSourceLoggedInUsername', data.user?.username || '');
          console.log(data.user?.username ? 'Logged in as: ' + data.user.username : 'No username provided in response');
          console.log(data.user?.role ? 'User role: ' + data.user.role : 'No role provided in response');
          console.log(data.user?.id ? 'Is admin user: ' + data.user.id : 'No user ID provided in response');
          this.userSourceLoggedInUsername = data.user?.username || null;
        }
        else{
          console.warn('sessionStorage is not available, cannot persist login state across page refreshes');
        }
        
        // Start silent refresh timer
        this.startUserSourceTokenRefreshTimer();
        console.log(this.userSourceRefreshTokenExpiresAt?.toString() + ' - ' + this.userSourceTokenExpiresAt.toString());
        this.userSourceAutomaticLogoutOnTokenExpiration();
        console.log('Login process completed successfully');
      } else {
        console.error('Login failed:', data.error);
        this.userSourceIsAuthenticated = false;
        this.userSourceTokenExpiresAt = null;
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('userSourceTokenExpiresAt');
          sessionStorage.removeItem('userSourceLoggedInUsername');
        }
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      this.userSourceIsAuthenticated = false;
      this.userSourceTokenExpiresAt = null;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('userSourceTokenExpiresAt');
        sessionStorage.removeItem('userSourceLoggedInUsername');
      }
      throw error;
    }
  }

  private userSourceAutomaticLogoutOnTokenExpiration(): void {
    console.log('Setting up automatic logout on token expiration' + (this.userSourceRefreshTokenExpiresAt ? `(expires at ${new Date(this.userSourceRefreshTokenExpiresAt).toISOString()})` : '(no expiration set)'));
    if (!this.userSourceIsAuthenticated || !this.userSourceTokenExpiresAt) {
      console.log('Not authenticated or no token expiration set, skipping automatic logout setup');
      return;
    }

    if (!this.userSourceRefreshTokenExpiresAt){
      console.warn('No refresh token expiration set, cannot setup automatic logout');
      return;
    }

    const timeUntilExpiration = this.userSourceRefreshTokenExpiresAt - Date.now() - 1000;
    console.log('Setting up automatic logout in', timeUntilExpiration / 1000, 'seconds');

     this.userSourceAutomaticLogoutTimerId = setTimeout(() => {
      console.log('Token expired, performing automatic logout');
      this.userSourceLogout();
    }, Math.max(0, timeUntilExpiration));

    console.log('Automatic logout timer ID:', this.userSourceAutomaticLogoutTimerId);
  }

  private startUserSourceTokenRefreshTimer(): void {
    if (!this.userSourceIsAuthenticated) {
      console.log('Not authenticated, skipping timer setup');
      return;
    }
    
    if (!this.userSourceTokenExpiresAt) return;
    
    console.log('startTokenRefreshTimer called. Current timer ID BEFORE assignment:', this.userSourceRefreshTimerId);
    
    // Clear any existing timer
    if (this.userSourceRefreshTimerId) {
      console.log('Clearing existing timer:', this.userSourceRefreshTimerId);
      clearTimeout(this.userSourceRefreshTimerId);
    }
    
    // Refresh 1 minute before expiration
    const timeUntilRefresh = this.userSourceTokenExpiresAt - Date.now() - 20000;
    
    this.userSourceRefreshTimerId = setTimeout(() => {
      console.log('Token refresh timer fired!');
      this.userSourceSilentRefresh();
    }, Math.max(0, timeUntilRefresh));
    
    this.userSourceRefreshTimerInitialized = true;
    console.log('Timer scheduled for', Math.max(0, timeUntilRefresh) / 1000, 'seconds. AFTER assignment, timer ID is:', this.userSourceRefreshTimerId);
  }

  private async userSourceSilentRefresh(): Promise<void> {
    try {
      console.log('Attempting silent token refresh...');
      console.log('Current token expires at:', this.userSourceTokenExpiresAt ? new Date(this.userSourceTokenExpiresAt).toISOString() : 'N/A');
      const endpoint = this.apiConfig.getEndpoint('/api/auth/refresh');
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const expiresInSeconds = data.expiresIn || 900;
        this.userSourceTokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
        
        // Update sessionStorage only in browser
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('userSourceTokenExpiresAt', this.userSourceTokenExpiresAt.toString());
        }
        
        this.userSourceRefreshTimerInitialized = false; // Reset so we can initialize the next timer
        this.startUserSourceTokenRefreshTimer(); // Restart timer
        console.log('Token refreshed silently, expires in:', expiresInSeconds, 'seconds');
      } else if(response.status === 401) {
        // Token expired or missing - stop trying to refresh
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 401:', errorData.error);
        this.userSourceClearAuthState();
        this.router.navigate(['/:lang/music-player/login']);
      } else if(response.status === 500) {
        // Server error - can't trust token validity, logout to prevent unauthorized access
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 500:', errorData.error);
        this.userSourceClearAuthState();
        this.router.navigate(['/:lang/music-player/login']);
      } else {
        // Any other error - treat as refresh failure, logout
        const data = await response.json().catch(() => ({}));
        console.warn('Silent refresh failed with status:', response.status, data.error || 'Unknown error');
        this.userSourceClearAuthState();
        this.router.navigate(['/:lang/music-player/login']);
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
      this.userSourceClearAuthState();
      this.router.navigate(['/:lang/music-player/login']);
    }
  }

  userSourceLogout(): void {
    console.log('Logout called');
    console.trace();
    this.userSourceClearAuthState();
    
    // Call backend logout if needed
    const endpoint = this.apiConfig.getEndpoint('/api/auth/logout');
    fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
    }).then(() => {
      console.log('Logout successful');
      this.router.navigate(['/:lang/music-player/login']);
    }).catch(err => console.error('Logout error:', err));
  }

  private userSourceClearAuthState(): void {
    // Set this first so any callbacks won't try to setup new timers
    this.userSourceIsAuthenticated = false;
    
    this.userSourceIsAdminUser = false;
    this.userSourceTokenExpiresAt = null;
    this.userSourceRefreshTimerInitialized = false;
    
    // Clear timer
    if (this.userSourceRefreshTimerId) {
      clearTimeout(this.userSourceRefreshTimerId);
      this.userSourceRefreshTimerId = null;
    }
    
    // Clear sessionStorage only in browser
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('userSourceTokenExpiresAt');
      sessionStorage.removeItem('userSourceLoggedInUsername');
    }
  }

  userSourceIsLoggedIn(): boolean {
    return this.userSourceIsAuthenticated;
  }

  userSourceGetLoggedInUsername(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem('userSourceLoggedInUsername');
  }

  isUserSourceTokenExpired(): boolean {
    if (!this.userSourceTokenExpiresAt) return true;
    console.log('Checking token expiration. Current time:', new Date().toISOString(), 'Token expires at:', new Date(this.userSourceTokenExpiresAt).toISOString());
    return Date.now() > this.userSourceTokenExpiresAt;
  }

  isAdmin(): boolean {
    return this.userSourceIsAdminUser;
  }

  private checkUserSourceAuthStatus(): void {
    // Only access sessionStorage in browser environment
    if (typeof sessionStorage === 'undefined') {
      console.log('checkUserSourceAuthStatus: Running on server, sessionStorage unavailable');
      return;
    }

    // On app load, restore authentication state from sessionStorage
    const storedExpiresAt = sessionStorage.getItem('userSourceTokenExpiresAt');
    console.log('checkUserSourceAuthStatus: Checking sessionStorage for tokenExpiresAt:', storedExpiresAt);
    
    if (storedExpiresAt) {
      this.userSourceTokenExpiresAt = parseInt(storedExpiresAt, 10);
      
      // Check if token is still valid
      if (Date.now() < this.userSourceTokenExpiresAt) {
        this.userSourceIsAuthenticated = true;
        console.log('✅ Session restored from sessionStorage, userSourceIsAuthenticated set to true');
        console.log('Guard check: userSourceRefreshTimerInitialized is', this.userSourceRefreshTimerInitialized);
        // Only start timer if one hasn't been initialized yet (avoid duplicate timers)
        if (!this.userSourceRefreshTimerInitialized) {
          console.log('Timer not initialized yet, starting new one');
          this.startUserSourceTokenRefreshTimer();
          this.userSourceAutomaticLogoutOnTokenExpiration();
        } else {
          console.log('Timer already initialized, skipping');
        }
      } else {
        // Token expired during page refresh
        console.log('❌ Token expired, clearing sessionStorage');
        sessionStorage.removeItem('userSourceTokenExpiresAt');
        sessionStorage.removeItem('userSourceLoggedInUsername');
        this.userSourceIsAuthenticated = false;
      }
    } else {
      console.log('checkUserSourceAuthStatus: No tokenExpiresAt in sessionStorage, user not authenticated');
    }
  }
}