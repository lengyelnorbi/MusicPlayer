import { getEndpoint } from "@/services/apiConfig";
import { loadStoredSession } from "@/services/auth";
import { saveDownloadedTrack } from "@/services/offlineLibrary";
import type { Music } from "@/types/music";

/**
 * Downloads a track using the stream route that actually exists in the
 * ASP.NET MusicController. The previous /download-url route was not defined
 * by the supplied backend.
 */
export async function downloadTrackForOfflineUse(track: Music) {
  const session = await loadStoredSession();
  if (!session?.accessToken) throw new Error("Sign in online before downloading music.");
  if (!Number.isInteger(track.id) || track.id <= 0) throw new Error("The track has an invalid ID.");

  const downloadUrl = getEndpoint(`/api/music/${track.id}/stream`);
  return saveDownloadedTrack(track, downloadUrl, session.accessToken);
}
