import { Injectable } from '@angular/core';
import { Music } from '../MusicPlayer/Models/music';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { startWith, catchError, delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config-service';

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.loadMoreMusic(); // Első adag betöltése indításkor
  }

  // Example method to fetch music data
  getMusicList(page?: number, limit?: number): Observable<Music[]> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const endpoint = this.apiConfig.getEndpoint(`/api/music${queryString}`);
    return this.http.get<Music[]>(endpoint).pipe(
      startWith([]),
      catchError((error) => {
        console.error('Fetch error:', error);
        return of([] as Music[]);  // Explicitly type as Music[]
      })
    );
  }

  private musicList = new BehaviorSubject<Music[]>([]);
  // Ezt az Observable-t fogja figyelni az async pipe a HTML-ben
  musics$: Observable<Music[]> = this.musicList.asObservable(); 

  private currentPage = 1;
  private limit = 10;
  private isLoading = false;

  loadMoreMusic() {
    if (this.isLoading) return;
    this.isLoading = true;

    // API hívás a getMusicList() metóduson keresztül
    this.getMusicList(this.currentPage, this.limit).subscribe(newTracks => {
      const currentTracks = this.musicList.getValue();
      // Az új zenéket hozzáfűzzük a meglévő listához (RxJS immutable módon)
      this.musicList.next([...currentTracks, ...newTracks]);
      this.currentPage++;
      this.isLoading = false;
    });
  }

  async downloadMusic(musicID: number): Promise<void> {
  const endpoint = this.apiConfig.getEndpoint(
    `/api/music/${musicID}/download`
  );

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const blob = await response.blob();

    // Get the filename from Content-Disposition
    const contentDisposition = response.headers.get(
      'Content-Disposition'
    );

    let filename = `music_${musicID}`;

    if (contentDisposition) {
      const match = contentDisposition.match(
        /filename\*=(?:UTF-8'')?([^;]+)|filename="?([^";]+)"?/i
      );

      if (match) {
        filename = decodeURIComponent(
          (match[1] ?? match[2]).trim()
        );
      }
    }
console.log(
  'Content-Disposition:',
  response.headers.get('Content-Disposition')
);

console.log(
  'Content-Type:',
  response.headers.get('Content-Type')
);
    console.log('Filename:', filename);
    console.log('MIME type:', blob.type);

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
  }
}
}