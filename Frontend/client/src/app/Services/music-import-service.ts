
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateImportJobRequest, CreateMusicImportResponse, ImportJob, ImportJobProgress } from '../MusicPlayer/Models/music-import.models-module';
import { ApiConfigService } from './api-config-service';

@Injectable({
  providedIn: 'root'
})
export class MusicImportService {
  constructor(private readonly http: HttpClient, private apiConfig: ApiConfigService) {}
  
  createJob(url: string): Observable<CreateMusicImportResponse> {
    const request: CreateImportJobRequest = { url };

    return this.http.post<CreateMusicImportResponse>(
      this.apiConfig.getEndpoint('api/music-import'),
      request
    );
  }

  getJob(jobId: string): Observable<ImportJob> {
    return this.http.get<ImportJob>(
      `${this.apiConfig.getEndpoint('api/music-import')}/${encodeURIComponent(jobId)}`
    );
  }

  getJobs(): Observable<ImportJob[]> {
    return this.http.get<ImportJob[]>(this.apiConfig.getEndpoint('api/music-import'));
  }

  retryJob(jobId: string): Observable<ImportJob> {
    return this.http.post<ImportJob>(
      `${this.apiConfig.getEndpoint('api/music-import')}/${encodeURIComponent(jobId)}/retry`,
      {}
    );
  }

  startJob(jobId: string): Observable<ImportJob> {
    return this.http.post<ImportJob>(
      `${this.apiConfig.getEndpoint('api/music-import')}/${encodeURIComponent(jobId)}/start`,
      {}
    );
  }

  startWorkItem(jobId: string, workItemId: string): Observable<ImportJob> {
    return this.http.post<ImportJob>(
      `${this.apiConfig.getEndpoint('api/music-import')}/${encodeURIComponent(jobId)}/work/${encodeURIComponent(workItemId)}/start`,
      {}
    );
  }

  downloadWorkItem(workItemId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiConfig.getEndpoint('api/music-import')}/work/${encodeURIComponent(workItemId)}/download`,
      { responseType: 'blob' }
    );
  }

  saveDownloadedFile(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(objectUrl);
  }
}
