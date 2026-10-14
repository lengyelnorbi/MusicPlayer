import { Music } from '@/types/music';
import { Playlist } from '@/types/playlist';

export class MusicListResponse {
    totalItemCount: number = 0;
    totalPages: number = 0;
    items: Music[] = [];
    userPlaylists: Playlist[] = [];
    availableGenres: string[] = [];
}
