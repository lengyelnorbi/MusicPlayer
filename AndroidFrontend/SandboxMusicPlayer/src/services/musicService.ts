import type { Music } from "@/types/music";
import type { MusicListResponse } from "@/types/music-list-response";
import { getEndpoint as getMusicEndpoint } from "@/services/apiConfig";
import { apiFetch, responseError } from "@/services/apiClient";

function normalizePlaylist(value: unknown): MusicListResponse["userPlaylists"][number] {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawId = raw.id ?? raw.ID;
  const rawName = raw.name ?? raw.Name;
  const rawCount = raw.musicCount ?? raw.MusicCount;
  return {
    id: typeof rawId === "number" ? rawId : Number(rawId) || 0,
    name: typeof rawName === "string" ? rawName : "Untitled playlist",
    ...(typeof rawCount === "number" ? { musicCount: rawCount } : {}),
  };
}

function normalizeMusic(value: unknown): Music {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = raw.id ?? raw.ID;
  const title = raw.title ?? raw.Title;
  const fileId = raw.file_id ?? raw.fileId ?? raw.File_id ?? raw.FileID;
  const genre = raw.genre ?? raw.Genre;
  const addedAt = raw.addedAt ?? raw.AddedAt;
  const rawPlaylistIds = raw.playlistIDs ?? raw.playlistIds ?? raw.PlaylistIDs;
  const playlistIDs = Array.isArray(rawPlaylistIds)
    ? rawPlaylistIds.filter((entry): entry is number => typeof entry === "number" && Number.isInteger(entry))
    : [];

  return {
    id: typeof id === "number" ? id : Number(id) || 0,
    title: typeof title === "string" ? title : "Untitled track",
    file_id: typeof fileId === "string" ? fileId : "",
    genre: typeof genre === "string" ? genre : "",
    addedAt: typeof addedAt === "string" ? addedAt : "",
    playlistIDs,
  };
}

export async function getMusicList(
  page = 1,
  limit = 10,
  search = "",
  genres: string[] = [],
): Promise<MusicListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set("search", search.trim());
  genres.forEach((genre) => params.append("genres", genre));

  const response = await apiFetch(`/api/music?${params.toString()}`);
  if (!response.ok) throw await responseError(response, "Could not load music");

  const payload = await response.json() as Record<string, unknown>;
  const itemsValue = payload.items ?? payload.Items;
  const playlistsValue = payload.userPlaylists ?? payload.UserPlaylists;
  const genresValue = payload.availableGenres ?? payload.AvailableGenres;
  const totalCount = payload.totalItemCount ?? payload.TotalItemCount;
  const totalPages = payload.totalPages ?? payload.TotalPages;

  return {
    totalItemCount: typeof totalCount === "number" ? totalCount : 0,
    totalPages: typeof totalPages === "number" ? totalPages : 0,
    items: Array.isArray(itemsValue) ? itemsValue.map(normalizeMusic).filter(item => item.id > 0) : [],
    userPlaylists: Array.isArray(playlistsValue) ? playlistsValue.map(normalizePlaylist).filter(playlist => playlist.id > 0) : [],
    availableGenres: Array.isArray(genresValue) ? genresValue.filter((item): item is string => typeof item === "string") : [],
  };
}

export async function addMusicToPlaylist(playlistID: number, musicID: number): Promise<boolean> {
  const response = await apiFetch("/api/playlistmusics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlistID, musicID }),
  });
  if (!response.ok) throw await responseError(response, "Could not add track to playlist");
  return true;
}

export async function removeMusicFromPlaylist(playlistID: number, musicID: number): Promise<boolean> {
  const response = await apiFetch("/api/playlistmusics", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlistID, musicID }),
  });
  if (!response.ok) throw await responseError(response, "Could not remove track from playlist");
  return true;
}

export function streamMusicByID(musicID: number): string {
  if (!Number.isInteger(musicID) || musicID <= 0) throw new Error("A valid music ID is required.");
  // This endpoint currently permits streaming without a login, which also
  // allows expo-audio to play the URL without needing custom request headers.
  return getMusicEndpoint(`/api/music/${musicID}/stream`);
}

