import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfigService } from './api-config-service';
import { MusicUploadRequest } from '../MusicPlayer/Models/music-import.models-module';

@Injectable({ providedIn: 'root' })
export class MusicUploadRequestService {
  private readonly endpoint = 'api/music-upload-requests';

  constructor(private readonly http: HttpClient, private readonly apiConfig: ApiConfigService) {}

  create(url: string): Observable<MusicUploadRequest> {
    return this.http.post<MusicUploadRequest>(this.apiConfig.getEndpoint(this.endpoint), { url });
  }

  mine(): Observable<MusicUploadRequest[]> {
    return this.http.get<MusicUploadRequest[]>(this.apiConfig.getEndpoint(`${this.endpoint}/mine`));
  }

  pending(): Observable<MusicUploadRequest[]> {
    return this.http.get<MusicUploadRequest[]>(this.apiConfig.getEndpoint(`${this.endpoint}/pending`));
  }

  importRequest(requestId: string): Observable<MusicUploadRequest> {
    return this.http.post<MusicUploadRequest>(
      this.apiConfig.getEndpoint(`${this.endpoint}/${encodeURIComponent(requestId)}/import`), {});
  }
}
