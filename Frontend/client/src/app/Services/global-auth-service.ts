import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ApiConfigService } from './api-config-service';

/**
 * Enum to differentiate between user and admin authentication sources
 */
export enum AuthSource {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Configuration interface for each authentication source
 */
interface AuthSourceConfig {
  source: AuthSource;
  cookieTokenName: string;
  cookieRefreshTokenName: string;
  storagePrefix: string;
  loginRoute: string;
  logoutRoute: string;
}

/**
 * AuthManager - Handles all authentication logic for a specific source
 * This class is reused for both user and admin authentication to eliminate code duplication
 */
class AuthManager {
  private isAuthenticated = false;
  private isAdminUser = false;
  private tokenExpiresAt: number | null = null;
  private refreshTimerId: any = null;
  private refreshTimerInitialized = false;
  private loggedInUsername: string | null = null;
  private refreshTokenExpiresAt: number | null = null;
  private automaticLogoutTimerId: any = null;
  private automaticLogoutTimerInitialized = false;
  private config: AuthSourceConfig;

  constructor(
    source: AuthSource,
    private router: Router,
    private apiConfig: ApiConfigService
  ) {
    this.config = this.getSourceConfig(source);
    this.checkAuthStatus();
  }

  /**
   * Get configuration for the authentication source
   */
  private getSourceConfig(source: AuthSource): AuthSourceConfig {
    const configs: Record<AuthSource, AuthSourceConfig> = {
      [AuthSource.USER]: {
        source: AuthSource.USER,
        cookieTokenName: 'userToken',
        cookieRefreshTokenName: 'userRefreshToken',
        storagePrefix: 'userSource',
        loginRoute: '/:lang/music-player/login',
        logoutRoute: '/home/login',
      },
      [AuthSource.ADMIN]: {
        source: AuthSource.ADMIN,
        cookieTokenName: 'adminToken',
        cookieRefreshTokenName: 'adminRefreshToken',
        storagePrefix: 'adminSource',
        loginRoute: '/admin/login',
        logoutRoute: '/admin/login',
      },
    };
    return configs[source];
  }

  /**
   * Get storage key with prefix
   */
  private getStorageKey(key: string): string {
    return `${this.config.storagePrefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<void> {
    try {
      console.log('Starting login process for:', email);
      
      console.log('source:', this.config.source);
      const endpoint = this.apiConfig.getEndpoint('/api/auth');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, source: this.config.source }),
      });

      const data = await response.json();
      console.log('Login response:', { ok: response.ok, data });

      if (response.ok && data.success) {
        console.log('Login successful');
        this.isAuthenticated = true;
        this.isAdminUser = data.user?.role === 'Admin';

        console.log('expiresIn from response and refreshTokenExpiresIn:', data.expiresIn, data.refreshTokenExpiresIn);

        if(!data.expiresIn || !data.refreshTokenExpiresIn) {
          console.warn('Login response missing token expiration info, using defaults');
          this.router.navigate([this.config.loginRoute]);
          return;
        }

        // Store token expiration
        const expiresInSeconds = data.expiresIn;
        console.log('Token expires in:', expiresInSeconds, 'seconds');
        this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;
        console.log('Token expires at:', new Date(this.tokenExpiresAt).toISOString());

        const refreshTokenExpiresInSeconds = data.refreshTokenExpiresIn;
        console.log('Refresh token expires in:', refreshTokenExpiresInSeconds, 'seconds');
        this.refreshTokenExpiresAt = Date.now() + refreshTokenExpiresInSeconds * 1000;
        console.log('Refresh token expires at:', new Date(this.refreshTokenExpiresAt).toISOString());

        // Store in sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.getStorageKey('tokenExpiresAt'), this.tokenExpiresAt.toString());
          sessionStorage.setItem(this.getStorageKey('refreshTokenExpiresAt'), this.refreshTokenExpiresAt?.toString() || '');
          sessionStorage.setItem(this.getStorageKey('loggedInUsername'), data.user?.username || '');
          console.log('Stored auth state in sessionStorage');
        } else {
          console.warn('sessionStorage is not available');
        }

        this.loggedInUsername = data.user?.username || null;
        this.startTokenRefreshTimer();
        this.setupAutomaticLogout();
        console.log('Login process completed successfully');
      } else {
        console.error('Login failed:', data.error);
        this.clearAuthState();
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login Error:', error);
      this.clearAuthState();
      throw error;
    }
  }

  /**
   * Setup automatic logout when refresh token expires
   */
  private setupAutomaticLogout(): void {
    console.log(
      'Setting up automatic logout on token expiration' +
        (this.refreshTokenExpiresAt ? `(expires at ${new Date(this.refreshTokenExpiresAt).toISOString()})` : '(no expiration set)')
    );

    if (!this.isAuthenticated || !this.tokenExpiresAt) {
      console.log('Not authenticated or no token expiration set');
      return;
    }

    if (!this.refreshTokenExpiresAt) {
      console.warn('No refresh token expiration set');
      return;
    }

     // Clear any existing timer
    if (this.automaticLogoutTimerId) {
      console.log('Clearing existing timer:', this.automaticLogoutTimerId);
      clearTimeout(this.automaticLogoutTimerId);
    }

    const timeUntilExpiration = this.refreshTokenExpiresAt - Date.now() - 1000;
    console.log('Setting up automatic logout in', timeUntilExpiration / 1000, 'seconds');

    this.automaticLogoutTimerId = setTimeout(() => {
      console.log('Token expired, performing automatic logout');
      this.logout();
    }, Math.max(0, timeUntilExpiration));

    this.automaticLogoutTimerInitialized = true;
    console.log('Automatic logout timer ID:', this.automaticLogoutTimerId);
  }

  /**
   * Start token refresh timer
   */
  private startTokenRefreshTimer(): void {
    if (!this.isAuthenticated) {
      console.log('Not authenticated, skipping timer setup');
      return;
    }

    if (!this.tokenExpiresAt) return;

    console.log('startTokenRefreshTimer called. Current timer ID BEFORE assignment:', this.refreshTimerId);

    // Clear any existing timer
    if (this.refreshTimerId) {
      console.log('Clearing existing timer:', this.refreshTimerId);
      clearTimeout(this.refreshTimerId);
    }

    // Refresh 30 seconds before expiration
    const timeUntilRefresh = this.tokenExpiresAt - Date.now() - 30000;

    this.refreshTimerId = setTimeout(() => {
      console.log('Token refresh timer fired!');
      this.silentRefresh();
    }, Math.max(0, timeUntilRefresh));

    this.refreshTimerInitialized = true;
    console.log('Timer scheduled for', Math.max(0, timeUntilRefresh) / 1000, 'seconds. Timer ID:', this.refreshTimerId);
  }

  /**
   * Silent token refresh
   */
  private async silentRefresh(): Promise<void> {
    try {
      console.log('Attempting silent token refresh...');
      console.log('Current token expires at:', this.tokenExpiresAt ? new Date(this.tokenExpiresAt).toISOString() : 'N/A');

      const endpoint = this.apiConfig.getEndpoint('/api/auth/refresh');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ source: this.config.source }),
      });

      if (response.ok) {
        const data = await response.json();

        if(!data.expiresIn) {
          console.warn('Refresh response missing token expiration info, using defaults');
          this.router.navigate([this.config.logoutRoute]);
          return;
        }

        const expiresInSeconds = data.expiresIn;
        this.tokenExpiresAt = Date.now() + expiresInSeconds * 1000;

        // Update sessionStorage
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.getStorageKey('tokenExpiresAt'), this.tokenExpiresAt.toString());
        }

        this.refreshTimerInitialized = false;
        this.startTokenRefreshTimer();
        console.log('Token refreshed silently, expires in:', expiresInSeconds, 'seconds');
      } else if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 401:', errorData.error);
        this.clearAuthState();
        this.router.navigate([this.config.logoutRoute]);
      } else if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Refresh failed with 500:', errorData.error);
        this.clearAuthState();
        this.router.navigate([this.config.logoutRoute]);
      } else {
        const data = await response.json().catch(() => ({}));
        console.warn('Silent refresh failed with status:', response.status, data.error || 'Unknown error');
        this.clearAuthState();
        this.router.navigate([this.config.logoutRoute]);
      }
    } catch (error) {
      console.error('Silent refresh failed:', error);
      this.clearAuthState();
      this.router.navigate([this.config.logoutRoute]);
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    console.log('Logout called');
    console.trace();

    const endpoint = this.apiConfig.getEndpoint('/api/auth/logout');
    try {
      await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      });
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.clearAuthState();
      this.router.navigate([this.config.logoutRoute]);  
    }
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    this.isAuthenticated = false;
    this.isAdminUser = false;
    this.tokenExpiresAt = null;
    this.refreshTimerInitialized = false;

    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    if (this.automaticLogoutTimerId) {
      clearTimeout(this.automaticLogoutTimerId);
      this.automaticLogoutTimerId = null;
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.getStorageKey('tokenExpiresAt'));
      sessionStorage.removeItem(this.getStorageKey('refreshTokenExpiresAt'));
      sessionStorage.removeItem(this.getStorageKey('loggedInUsername'));
    }
  }

  /**
   * Check authentication status on app load
   */
  private checkAuthStatus(): void {
    if (typeof sessionStorage === 'undefined') {
      console.log('checkAuthStatus: Running on server, sessionStorage unavailable');
      return;
    }

    const storedExpiresAt = sessionStorage.getItem(this.getStorageKey('tokenExpiresAt'));
    console.log(`checkAuthStatus: Checking sessionStorage for ${this.config.source} tokenExpiresAt:`, storedExpiresAt);

    const storedRefreshTokenExpiresAt = sessionStorage.getItem(this.getStorageKey('refreshTokenExpiresAt'));
    console.log(`checkAuthStatus: Checking sessionStorage for ${this.config.source} refreshTokenExpiresAt:`, storedRefreshTokenExpiresAt);


    if (storedExpiresAt && storedRefreshTokenExpiresAt) {
      this.tokenExpiresAt = parseInt(storedExpiresAt, 10);
      this.refreshTokenExpiresAt = parseInt(storedRefreshTokenExpiresAt, 10);

      if (Date.now() < this.tokenExpiresAt && Date.now() < this.refreshTokenExpiresAt) {
        this.isAuthenticated = true;
        console.log(`✅ ${this.config.source} session restored from sessionStorage`);
        console.log('Guard check: refreshTimerInitialized is', this.refreshTimerInitialized);
        console.log('Guard check: automaticLogoutTimerInitialized is', this.automaticLogoutTimerInitialized);

        if (!this.refreshTimerInitialized) {
          console.log('Timer not initialized yet, starting new one');
          this.startTokenRefreshTimer();
          this.setupAutomaticLogout();
        } else {
          console.log('Timer already initialized, skipping');
        }
      } else {
        console.log('❌ Token expired, clearing sessionStorage');
        sessionStorage.removeItem(this.getStorageKey('tokenExpiresAt'));
        sessionStorage.removeItem(this.getStorageKey('refreshTokenExpiresAt'));
        sessionStorage.removeItem(this.getStorageKey('loggedInUsername'));
        this.isAuthenticated = false;
      }
    } else {
      console.log(`checkAuthStatus: No tokenExpiresAt in sessionStorage for ${this.config.source}`);
    }
  }

  // ===== Public Getters =====

  getIsLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getLoggedInUsername(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(this.getStorageKey('loggedInUsername'));
  }

  getIsTokenExpired(): boolean {
    if (!this.tokenExpiresAt) return true;
    console.log('Checking token expiration. Current time:', new Date().toISOString(), 'Token expires at:', new Date(this.tokenExpiresAt).toISOString());
    return Date.now() > this.tokenExpiresAt;
  }

  getIsAdmin(): boolean {
    return this.isAdminUser;
  }
}

/**
 * GlobalAuthService - Manages both user and admin authentication
 * Uses two instances of AuthManager to eliminate code duplication
 * while maintaining the same public API as the original services
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalAuthService {
  private userAuthManager: AuthManager;
  private adminAuthManager: AuthManager;

  constructor(private router: Router, private apiConfig: ApiConfigService) {
    this.userAuthManager = new AuthManager(AuthSource.USER, router, apiConfig);
    this.adminAuthManager = new AuthManager(AuthSource.ADMIN, router, apiConfig);
  }

  // ===== USER AUTHENTICATION METHODS =====

  async userSourceLogin(email: string, password: string): Promise<void> {
    return this.userAuthManager.login(email, password);
  }

  userSourceLogout(): void {
    this.userAuthManager.logout();
  }

  userSourceIsLoggedIn(): boolean {
    return this.userAuthManager.getIsLoggedIn();
  }

  userSourceGetLoggedInUsername(): string | null {
    return this.userAuthManager.getLoggedInUsername();
  }

  isUserSourceTokenExpired(): boolean {
    return this.userAuthManager.getIsTokenExpired();
  }

  // ===== ADMIN AUTHENTICATION METHODS =====

  async adminSourceLogin(email: string, password: string): Promise<void> {
    return this.adminAuthManager.login(email, password);
  }

  async adminSourceLogout(): Promise<void> {
    return this.adminAuthManager.logout();
  }

  adminSourceIsLoggedIn(): boolean {
    return this.adminAuthManager.getIsLoggedIn();
  }

  adminSourceGetLoggedInUsername(): string | null {
    return this.adminAuthManager.getLoggedInUsername();
  }

  isAdminSourceTokenExpired(): boolean {
    return this.adminAuthManager.getIsTokenExpired();
  }

  // ===== SHARED METHODS =====

  isAdmin(): boolean {
    return this.adminAuthManager.getIsAdmin();
  }
}
