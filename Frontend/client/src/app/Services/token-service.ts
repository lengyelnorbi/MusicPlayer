import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfigService } from './api-config-service';
import { startWith } from 'rxjs/internal/operators/startWith';
import { catchError } from 'rxjs/internal/operators/catchError';
import { AccessToken } from '../MusicPlayer/Models/access-token';
import { RefreshToken } from '../MusicPlayer/Models/refresh-token';
import { Observable, of, Subscription } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Router } from '@angular/router';
import { PagedResult } from '../Shared/Utils/PagedResult';

export enum TokenType {
  ACCESSTOKEN = 'access-token',
  REFRESHTOKEN = 'refresh-token'
}

/**
 * Configuration interface for each authentication source
 */
interface TokenTypeConfig {
  tokenType: TokenType;
  currentPage: number | null;
  limit: number | null;
  isLoading: boolean;
}

class TokenManager<T> {
  private tokenType: TokenType; // Default token type
  private currentPage: number = 1;
  private limit: number = 10;
  private isLoading = false;
  tokenList = new BehaviorSubject<T[]>([]);
  token$: Observable<T[]> = this.tokenList.asObservable(); 
  private config: TokenTypeConfig;
  private tokenListSubscription?: Subscription; // To store the subscription for cleanup
  private maxPageCount: number = 0; // To keep track of the current page number for pagination
  private maxItemCount: number = 0; // To keep track of the number of items to fetch per page

  constructor(
    tokenType: TokenType,
    private router: Router,
    private apiConfig: ApiConfigService,
    private http: HttpClient
  ) {
    this.config = this.getTokenTypeConfig(tokenType);
    this.tokenType = this.config.tokenType;
  }

  /**
   * Get configuration for the authentication source
   */
  private getTokenTypeConfig(tokenType: TokenType): TokenTypeConfig {
    const configs: Record<TokenType, TokenTypeConfig> = {
      [TokenType.ACCESSTOKEN]: {
        tokenType: TokenType.ACCESSTOKEN,
        currentPage: 1,
        limit: 10,
        isLoading: false,
      },
      [TokenType.REFRESHTOKEN]: {
        tokenType: TokenType.REFRESHTOKEN,
        currentPage: 1,
        limit: 10,
        isLoading: false,
      }
    };
    return configs[tokenType];
  }

  // Example method to fetch user data
  getTokenList(page: number = 1, limit: number = 10): Observable<PagedResult<T>> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    console.log(`Fetching ${this.tokenType} with params:`, { page, limit });
    console.log(this.tokenType.toString());
    console.trace('getTokenList called with tokenType:', this.tokenType);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const endpoint = this.apiConfig.getEndpoint(`/api/token/${this.tokenType.toString()}${queryString}`);
    return this.http.get<PagedResult<T>>(endpoint).pipe(
      startWith({ totalItemCount: 0, totalPages: 0, items: [] }),
      catchError((error) => {
        console.error('Fetch error:', error);
        return of({ totalItemCount: 0, totalPages: 0, items: [] } as (PagedResult<T> | PagedResult<T>));  // Explicitly type as AccessToken[] or RefreshToken[]
      })
    );
  }

  loadMoreTokens() {
    if (this.isLoading) return;
    this.isLoading = true;

    // API hívás a getTokenList() metóduson keresztül
    this.tokenListSubscription = this.getTokenList(this.currentPage, this.limit).subscribe(newTokens => {
      console.log('received', newTokens);
      const currentTokens = this.tokenList.getValue();
      // Az új tokeneket hozzáfűzzük a meglévő listához (RxJS immutable módon)
      this.tokenList.next([...currentTokens, ...newTokens.items]);
      this.currentPage++;
      this.isLoading = false;
    });
  }

  UnsubscribeFromTokenList() {
    if (this.tokenListSubscription) {
      this.tokenListSubscription.unsubscribe();
    }
  }

  async RevokeToken(tokenID: number): Promise<boolean> {
    const endpoint = this.apiConfig.getEndpoint(
      `/api/token/revoke-${this.tokenType.toString()}`
    );

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          tokenID,
          source: 'Admin'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Token revoked successfully');
      return true;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }
}


@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private accessTokenTypeManager: TokenManager<AccessToken>;
  private refreshTokenTypeManager: TokenManager<RefreshToken>;

  constructor(private http: HttpClient, private router: Router, private apiConfig: ApiConfigService) {
    this.accessTokenTypeManager = new TokenManager<AccessToken>(TokenType.ACCESSTOKEN, router, apiConfig, http);
    this.refreshTokenTypeManager = new TokenManager<RefreshToken>(TokenType.REFRESHTOKEN, router, apiConfig, http);
    console.log('TokenService created');
  }

  clearAccessTokenLists() {
    console.log('Clearing token lists in TokenService');
    this.accessTokenTypeManager.tokenList.next([]);
    this.accessTokenTypeManager.UnsubscribeFromTokenList();
  }

  getAccessTokenList(page?: number, limit?: number): Observable<PagedResult<AccessToken>> {
    return this.accessTokenTypeManager.getTokenList(page, limit);
  }

  async revokeAccessToken(tokenId: number): Promise<boolean> {
    return this.accessTokenTypeManager.RevokeToken(tokenId);
  }

  loadMoreAccessTokens() {
    this.accessTokenTypeManager.loadMoreTokens();
  }

  get accessTokens$() {
   return this.accessTokenTypeManager.token$;
  }

  get refreshTokens$() {
    return this.refreshTokenTypeManager.token$;
  }

  clearRefreshTokenLists() {
    this.refreshTokenTypeManager.tokenList.next([]);
    this.refreshTokenTypeManager.UnsubscribeFromTokenList();
  }

  getRefreshTokenList(page?: number, limit?: number): Observable<PagedResult<RefreshToken>> {
    return this.refreshTokenTypeManager.getTokenList(page, limit);
  }

  async revokeRefreshToken(tokenId: number): Promise<boolean> {
    return this.refreshTokenTypeManager.RevokeToken(tokenId);
  }

  loadMoreRefreshTokens() {
    this.refreshTokenTypeManager.loadMoreTokens();
  }
}


// @Injectable()
// export class TokenService {
//   constructor(
//     private http: HttpClient,
//     private apiConfig: ApiConfigService
//   ) {
//     this.loadMoreAccessTokens(); // Első adag betöltése indításkor
//   }

//   // Example method to fetch user data
//   getAccessTokenList(page?: number, limit?: number): Observable<AccessToken[]> {
//     const params = new URLSearchParams();
//     if (page !== undefined) params.append('page', page.toString());
//     if (limit !== undefined) params.append('limit', limit.toString());
    
//     const queryString = params.toString() ? `?${params.toString()}` : '';
//     const endpoint = this.apiConfig.getEndpoint(`/api/token/access-tokens${queryString}`);
//     return this.http.get<AccessToken[]>(endpoint).pipe(
//       startWith([]),
//       catchError((error) => {
//         console.error('Fetch error:', error);
//         return of([] as AccessToken[]);  // Explicitly type as AccessToken[]
//       })
//     );
//   }

//   private accessTokenList = new BehaviorSubject<AccessToken[]>([]);
//   // Ezt az Observable-t fogja figyelni az async pipe a HTML-ben
//   accessToken$: Observable<AccessToken[]> = this.accessTokenList.asObservable(); 

//   private currentPage = 1;
//   private limit = 10;
//   private isLoading = false;

//   loadMoreAccessTokens() {
//     if (this.isLoading) return;
//     this.isLoading = true;

//     // API hívás a getAccessTokenList() metóduson keresztül
//     this.getAccessTokenList(this.currentPage, this.limit).subscribe(newTokens => {
//       const currentTokens = this.accessTokenList.getValue();
//       // Az új tokeneket hozzáfűzzük a meglévő listához (RxJS immutable módon)
//       this.accessTokenList.next([...currentTokens, ...newTokens]);
//       this.currentPage++;
//       this.isLoading = false;
//     });
//   }
// }