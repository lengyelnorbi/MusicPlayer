import { environment } from '@/environment';
import { MusicListResponse } from '@/types/music-list-response';

export async function getMusicList(
  page: number = 1,
  limit: number = 10,
  search?: string,
  genres: string[] = []
): Promise<MusicListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search?.trim()) {
    params.append('search', search.trim());
  }

  genres.forEach((genre) => {
    params.append('genres', genre);
  });

  const apiUrl =
    `${environment.urlBase}${environment.apiBaseUrl}:${environment.apiPort}` +
    `/api/music?${params.toString()}`;

  const response = await fetch(apiUrl, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}