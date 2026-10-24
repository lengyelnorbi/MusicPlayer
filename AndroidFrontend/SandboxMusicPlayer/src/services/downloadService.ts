import { getEndpoint } from "@/services/apiConfig";
import { loadStoredSession } from "@/services/auth";
import { getOfflineTracks, saveDownloadedTrack } from "@/services/offlineLibrary";
import type { Music } from "@/types/music";
import { getMusicList } from "@/services/musicService";

export type DownloadProgress = {
  completed: number;
  total: number;
  currentTitle: string;
};
/**
 * Downloads a track using the stream route that actually exists in the
 * ASP.NET MusicController. The previous /download-url route was not defined
 * by the supplied backend.
 */
export async function downloadTrackForOfflineUse(track: Music) {
  const session = await loadStoredSession();
  if (!session?.accessToken) throw new Error("Sign in online before downloading music.");
  if (!Number.isInteger(track.id) || track.id <= 0) throw new Error("The track has an invalid ID.");

  const downloadUrl = getEndpoint(`/api/music/${track.id}/download`);
  return saveDownloadedTrack(track, downloadUrl, session.accessToken);
}

export async function downloadAllMusicForOfflineUse(
  onProgress?: (progress: DownloadProgress) => void,
): Promise<number> {
  const session = await loadStoredSession();

  if (!session?.accessToken) {
    throw new Error("Please sign in before downloading music.");
  }

  // Fetch the complete catalogue, one page at a time.
  const pageSize = 100;
  const firstPage = await getMusicList(1, pageSize);
  const tracks = [...firstPage.items];

  for (let page = 2; page <= firstPage.totalPages; page++) {
    const result = await getMusicList(page, pageSize);
    tracks.push(...result.items);
  }

  if (tracks.length === 0) {
    throw new Error("No music tracks were found in the catalogue.");
  }
	
  // Reuse tracks whose downloaded files still exist on the device.
  const offlineTracks = await getOfflineTracks();
  const offlineTrackIds = new Set(offlineTracks.map((track) => track.id));
  let completed = 0;

  // Download sequentially to avoid overwhelming the API or phone.
  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index];

    if (offlineTrackIds.has(track.id)) {
      completed++;
      onProgress?.({
        completed,
        total: tracks.length,
        currentTitle: `${track.title} (already downloaded)`,
      });
      continue;
    }

    const downloadUrl = getEndpoint(
      `/api/music/${track.id}/download`,
    );

    await saveDownloadedTrack(
      track,
      downloadUrl,
      session.accessToken,
    );

    completed++;
    onProgress?.({
      completed,
      total: tracks.length,
      currentTitle: track.title,
    });
  }

  return completed;
}