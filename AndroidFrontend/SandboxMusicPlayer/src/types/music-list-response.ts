import type { Playlist } from "@/types/playlist";
import type { Music } from "@/types/music";

export type MusicListResponse = {
  totalItemCount: number;
  totalPages: number;
  items: Music[];
  userPlaylists: Playlist[];
  availableGenres: string[];
};
