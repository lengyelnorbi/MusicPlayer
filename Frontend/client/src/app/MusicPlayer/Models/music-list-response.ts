import { Music } from './music';
import { Playlist } from './playlist';

export class MusicListResponse {
    totalItemCount: number = 0;
    totalPages: number = 0;
    items: Music[] = [];
    userPlaylists: Playlist[] = [];
}
