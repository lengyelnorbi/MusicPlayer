import { getEndpoint } from "./apiConfig";
import type { Playlist } from "@/types/playlist";
import type { PagedResult } from "@/types/PagedResult";

export async function getPlaylistByID(playlistID: number): Promise<unknown> {
  const response = await fetch(getEndpoint(`/api/playlist/${playlistID}`), {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}

export async function getUserPlaylists(
  userID: number,
  page = 1,
  limit = 10
): Promise<PagedResult<Playlist>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(
    getEndpoint(`/api/playlist/user/${userID}?${params.toString()}`),
    { credentials: "include" }
  );
  if (!response.ok) throw new Error(`Playlist fetch failed: ${response.status}`);
  return response.json();
}

export async function createPlaylist(name: string): Promise<unknown> {
  const response = await fetch(getEndpoint("/api/playlist"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  return response.json();
}

export async function getAllPlaylists(
  page = 1,
  limit = 10
): Promise<PagedResult<Playlist>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(getEndpoint(`/api/playlist?${params.toString()}`), {
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Playlist fetch failed: ${response.status}`);
  return response.json();
}
