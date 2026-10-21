import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiConfigService {
  private apiBaseUrl: string = '';
  private isProduction: boolean = environment.production;

  constructor() {
    // this.apiBaseUrl = this.getApiBaseUrl();
    // // Log config for debugging
    // if (typeof window !== 'undefined') {
    //   console.log('[ApiConfigService] Initialized:', {
    //     environment: this.isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
    //     appLocation: window.location.href,
    //     appHostname: window.location.hostname,
    //     appPort: window.location.port || 'default',
    //     apiBaseUrl: this.apiBaseUrl,
    //     protocol: window.location.protocol,
    //   });
    // }
    if(!environment.production) {
      this.apiBaseUrl = this.getDevApiBaseUrl();
    }
  }

  getDevApiBaseUrl(): string {
    return environment.urlBase + environment.apiBaseUrl + ':' + environment.apiPort;
  }

  getEndpoint(path: string): string {
    // Remove leading slash if present
    const fullEndPoint = `${this.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    // Debug logging
    console.log('[ApiConfigService] getEndpoint:', {
      path,
      fullEndPoint,
    });
    return fullEndPoint;
  }

    /**
   * Get the API base URL based on environment and current location
   * 
   * DEVELOPMENT MODE:
   *   - Detects the current hostname (192.168.1.6 or localhost)
   *   - Uses the same hostname for API with port 8080
   *   - If accessed from 192.168.1.6:4200, API is at 192.168.1.6:8080
   *   - If accessed from localhost:4200, API is at localhost:8080
   * 
   * PRODUCTION MODE:
   *   - Uses hardcoded domain from environment.prod.ts if set (apiBaseUrl property)
   *   - Falls back to deriving from current window.location
   */
  // private getApiBaseUrl(): string {
  //   if (typeof window === 'undefined') {
  //     // SSR fallback
  //     return 'http://192.168.1.6:8080';
  //   }

  //   const protocol = window.location.protocol; // http: or https:
  //   const hostname = window.location.hostname; // localhost, 127.0.0.1, or IP address
  //   const apiPort = environment.apiPort || 8080;

  //   if (this.isProduction) {
  //     // Production mode: Use hardcoded domain if available, else use current origin
  //     const hardcodedUrl = (environment as any).apiBaseUrl;
  //     if (hardcodedUrl) {
  //       return hardcodedUrl;
  //     }
  //     // Fallback: derive from current location
  //     return `${protocol}//${hostname}:${apiPort}`;
  //   } else {
  //     // Development mode: Always match the client hostname with API port
  //     return `${protocol}//${hostname}:${apiPort}`;
  //   }
  // }

  // /**
  //  * Check if running on localhost
  //  */
  // private isLocalhost(): boolean {
  //   if (typeof window === 'undefined') return false;
  //   const host = window.location.hostname;
  //   return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  // }

  // /**
  //  * Get full API endpoint URL
  //  */
  // public getEndpoint(path: string): string {
  //   // Remove leading slash if present
  //   const cleanPath = path.startsWith('/') ? path : `/${path}`;
  //   const fullEndpoint = `${this.apiBaseUrl}${cleanPath}`;
    
  //   // Debug logging
  //   console.log('[ApiConfigService] getEndpoint:', {
  //     path,
  //     cleanPath,
  //     baseUrl: this.apiBaseUrl,
  //     fullEndpoint,
  //     hostname: typeof window !== 'undefined' ? window.location.hostname : 'SSR',
  //   });
    
  //   return fullEndpoint;
  // }

  // /**
  //  * Get base URL (without trailing slash)
  //  */
  // public getBaseUrl(): string {
  //   return this.apiBaseUrl;
  // }

  // /**
  //  * Log current API configuration (useful for debugging)
  //  */
  // public logConfig(): void {
  //   console.log('API Base URL:', this.apiBaseUrl);
  //   if (typeof window !== 'undefined') {
  //     console.log('Current Host:', window.location.hostname);
  //     console.log('Is Localhost:', this.isLocalhost());
  //     console.log('Full App URL:', window.location.href);
  //   }
  // }
}
