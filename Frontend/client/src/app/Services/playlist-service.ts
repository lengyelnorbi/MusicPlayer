import { Injectable } from '@angular/core';
import { ApiConfigService } from './api-config-service';

@Injectable({
  providedIn: 'root',
})
export class PlaylistService {
  constructor(private apiConfigService: ApiConfigService) { }

  async getUserPlaylists(userID: number): Promise<any> {
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist/user/${userID}`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async getPlaylistByID(playlistID: number): Promise<any> {
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist/${playlistID}`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async getPlaylists(): Promise<any> {
    const endpoint = this.apiConfigService.getEndpoint(`/api/playlist`);
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}