import { getEndpoint } from "./apiConfig";
import type { Music } from "@/types/music";
import type { MusicListResponse } from "@/types/music-list-response";

const emptyMusicResponse: MusicListResponse = {
  totalItemCount: 0,
  totalPages: 0,
  items: [],
  userPlaylists: [],
  availableGenres: [],
};

export async function getMusicList(
  page = 1,
  limit = 10,
  search = "",
  genres: string[] = []
): Promise<MusicListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (search.trim()) params.set("search", search.trim());
  genres.forEach((genre) => params.append("genres", genre));

  try {
    const response = await fetch(
      getEndpoint(`/api/music?${params.toString()}`),
      { credentials: "include" }
    );
    if (!response.ok) throw new Error(`Music fetch failed: ${response.status}`);
    return (await response.json()) as MusicListResponse;
  } catch (error) {
    console.error("Fetch music error:", error);
    return emptyMusicResponse;
  }
}

export async function addMusicToPlaylist(
  playlistID: number,
  musicID: number
): Promise<boolean> {
  const response = await fetch(getEndpoint("/api/playlistmusics"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlistID, musicID }),
  });
  return response.ok;
}

export async function removeMusicFromPlaylist(
  playlistID: number,
  musicID: number
): Promise<boolean> {
  const response = await fetch(getEndpoint("/api/playlistmusics"), {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ playlistID, musicID }),
  });
  return response.ok;
}

export async function getMusicsPlaylists(musicIDs: number[]): Promise<unknown> {
  const response = await fetch(getEndpoint("/api/musicplaylists"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ musicIDs }),
  });
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}

export function streamMusicByID(musicID: number): string {
  return getEndpoint(`/api/music/${musicID}/stream`);
}

// Native download/share behavior is intentionally handled by the screen/app layer.
// For a downloadable file, install expo-file-system and expo-sharing, then use
// FileSystem.downloadAsync(getEndpoint(`/api/music/${musicID}/download`), localUri)
// followed by Sharing.shareAsync(localUri).
export async function downloadMusic(musicID: number): Promise<string> {
  return getEndpoint(`/api/music/${musicID}/download`);
}
