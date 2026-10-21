import { Injectable } from '@angular/core';
import { ApiConfigService } from './api-config-service';
import { PagedResult } from '../Shared/Utils/PagedResult';
import { Observable } from 'rxjs/internal/Observable';
import { Playlist } from '../MusicPlayer/Models/playlist';
import { startWith } from 'rxjs/internal/operators/startWith';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  constructor(private apiConfigService: ApiConfigService,
    private http: HttpClient) { }

  // async getUserPlaylists(userID: number): Promise<any> {
  //   const endpoint = this.apiConfigService.getEndpoint(`/api/playlist/user/${userID}`);
  //   const response = await fetch(endpoint);
  //   if (!response.ok) {
  //     throw new Error(`HTTP error! status: ${response.status}`);
  //   }
  //   return await response.json();
  // }

  async getPlaylistByID(playlistID: number): Promise<any> {
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist/${playlistID}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  getUserPlaylists(userID: number, page: number = 1, limit: number = 10): Observable<PagedResult<Playlist>> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist/user/${userID}${queryString}`);
    return this.http.get<PagedResult<Playlist>>(endpoint).pipe(
        catchError((error) => {
          console.error('Fetch error:', error);
          return of({ totalItemCount: 0, totalPages: 0, items: [] });  // Explicitly type as AccessToken[] or RefreshToken[]
        })
    );
  }

  createPlaylist(name: string): Promise<any> {
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist`);
    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    }).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  }

  getAllPlaylists(page: number = 1, limit: number = 10): Observable<PagedResult<Playlist>> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist${queryString}`);
    return this.http.get<PagedResult<Playlist>>(endpoint).pipe(
        startWith({ totalItemCount: 0, totalPages: 0, items: [] }),
        catchError((error) => {
          console.error('Fetch error:', error);
          return of({ totalItemCount: 0, totalPages: 0, items: [] } as PagedResult<Playlist>);  // Explicitly type as AccessToken[] or RefreshToken[]
        })
    );
  }
}