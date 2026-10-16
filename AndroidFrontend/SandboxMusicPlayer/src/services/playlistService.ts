import { apiFetch, responseError } from "@/services/apiClient";
import type { PagedResult } from "@/types/PagedResult";
import type { Playlist } from "@/types/playlist";

function normalizePlaylist(value: unknown): Playlist {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawId = raw.id ?? raw.ID;
  const rawName = raw.name ?? raw.Name;
  const rawCount = raw.musicCount ?? raw.MusicCount;
  const rawMusics = raw.musics ?? raw.Musics;
  const rawDuration = raw.duration ?? raw.Duration;

  return {
    id: typeof rawId === "number" ? rawId : Number(rawId) || 0,
    name: typeof rawName === "string" ? rawName : "Untitled playlist",
    ...(typeof rawCount === "number" ? { musicCount: rawCount } : {}),
    ...(Array.isArray(rawMusics) ? { musics: rawMusics as Playlist["musics"] } : {}),
    ...(typeof rawDuration === "number" ? { duration: rawDuration } : {}),
  };
}

export async function getPlaylistByID(playlistID: number): Promise<Playlist> {
  if (!Number.isInteger(playlistID) || playlistID <= 0) throw new Error("A valid playlist ID is required.");
  const response = await apiFetch(`/api/playlist/${playlistID}`);
  if (!response.ok) throw await responseError(response, "Could not load playlist");
  return normalizePlaylist(await response.json());
}

export async function getUserPlaylists(
  userID: number,
  page = 1,
  limit = 50,
): Promise<PagedResult<Playlist>> {
  if (!Number.isInteger(userID) || userID <= 0) throw new Error("A valid user ID is required.");
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    throw new Error("Page and page size must be positive integers.");
  }

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await apiFetch(`/api/playlist/user/${userID}?${params.toString()}`);
  if (!response.ok) throw await responseError(response, "Could not load playlists");

  const payload = await response.json() as Record<string, unknown>;
  const rawItems = payload.items ?? payload.Items;
  const rawCount = payload.totalItemCount ?? payload.TotalItemCount;
  const rawPages = payload.totalPages ?? payload.TotalPages;
  return {
    items: Array.isArray(rawItems) ? rawItems.map(normalizePlaylist) : [],
    totalItemCount: typeof rawCount === "number" ? rawCount : 0,
    totalPages: typeof rawPages === "number" ? rawPages : 0,
  };
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Playlist name is required.");
  const response = await apiFetch("/api/playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: trimmed }),
  });
  if (!response.ok) throw await responseError(response, "Could not create playlist");
  const payload = await response.json() as Record<string, unknown>;
  return normalizePlaylist(payload.result ?? payload.Result ?? payload);
}
