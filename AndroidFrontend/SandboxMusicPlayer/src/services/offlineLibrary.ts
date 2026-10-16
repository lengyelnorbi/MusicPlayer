import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import type { Music } from '@/types/music';

const DB_NAME = 'offline-music.db';
const AUDIO_DIR = `${FileSystem.documentDirectory ?? ''}offline-music/`;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export type OfflineTrack = Omit<Music, 'genre' | 'addedAt'> & {
  genre?: string | null;
  addedAt?: string;
  fileUri: string;
};

async function db() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  const database = await dbPromise;
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_tracks (
      id INTEGER PRIMARY KEY,
      file_id TEXT,
      title TEXT NOT NULL,
      genre TEXT,
      addedAt TEXT,
      playlistIDs TEXT NOT NULL DEFAULT '[]',
      fileUri TEXT NOT NULL,
      downloadedAt TEXT NOT NULL
    );
  `);
  return database;
}

export async function initializeOfflineLibrary() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Offline downloads require a native device with persistent file storage.");
  }
  const database = await db();
  await FileSystem.makeDirectoryAsync(AUDIO_DIR, { intermediates: true });
  const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM offline_tracks');
  return { databaseReady: true, trackCount: result?.count ?? 0, audioDirectory: AUDIO_DIR };
}

type OfflineTrackRow = {
  id: number;
  file_id: string;
  title: string;
  genre: string | null;
  addedAt: string | null;
  playlistIDs: string;
  fileUri: string;
};

export async function getOfflineTracks(): Promise<OfflineTrack[]> {
  await initializeOfflineLibrary();
  const database = await db();

  const rows = await database.getAllAsync<OfflineTrackRow>(`
    SELECT id, title, genre, addedAt, playlistIDs,
           file_id, fileUri
    FROM offline_tracks
    ORDER BY title COLLATE NOCASE
  `);

  const valid: OfflineTrack[] = [];

  for (const row of rows) {
    const info = await FileSystem.getInfoAsync(row.fileUri);

    if (!info.exists) {
      await database.runAsync(
        'DELETE FROM offline_tracks WHERE id = ?',
        row.id,
      );
      continue;
    }

    let playlistIDs: number[] = [];

    try {
      const parsed: unknown = JSON.parse(row.playlistIDs);
      if (Array.isArray(parsed)) {
        playlistIDs = parsed.filter(
          (id): id is number =>
            typeof id === 'number' && Number.isInteger(id),
        );
      }
    } catch {
      playlistIDs = [];
    }

    valid.push({
      id: row.id,
      file_id: row.file_id ?? '',
      title: row.title,
      genre: row.genre,
      addedAt: row.addedAt ?? undefined,
      playlistIDs,
      fileUri: row.fileUri,
    });
  }

  return valid;
}

export async function saveDownloadedTrack(
  music: Music,
  downloadUrl: string,
  accessToken?: string,
): Promise<OfflineTrack> {
  await initializeOfflineLibrary();

  if (!FileSystem.documentDirectory) {
    throw new Error("This device does not provide a persistent document directory.");
  }
  if (!Number.isInteger(music.id) || music.id <= 0) {
    throw new Error("The track has an invalid ID.");
  }
  let parsedDownloadUrl: URL;
  try {
    parsedDownloadUrl = new URL(downloadUrl);
  } catch {
    throw new Error("The audio download URL is invalid.");
  }
  if (parsedDownloadUrl.protocol !== "http:" && parsedDownloadUrl.protocol !== "https:") {
    throw new Error("The audio download URL must use HTTP or HTTPS.");
  }

  const safeName =
    `${music.id}-${music.title.replace(/[^a-z0-9-_]/gi, '_').slice(0, 70)}-${Date.now()}.m4a`;
  const fileUri = `${AUDIO_DIR}${safeName}`;

  const headers = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : undefined;

  const result = await FileSystem.downloadAsync(
    downloadUrl,
    fileUri,
    headers ? { headers } : undefined,
  );

  if (result.status < 200 || result.status >= 300) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true })
      .catch(() => undefined);
    throw new Error(`Audio download failed (HTTP ${result.status}).`);
  }

  const downloadedFile = await FileSystem.getInfoAsync(result.uri, { size: true });
  if (!downloadedFile.exists || !downloadedFile.size) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(() => undefined);
    throw new Error("The downloaded audio file is empty or could not be saved.");
  }

  try {
    const database = await db();
    const previous = await database.getFirstAsync<{ fileUri: string }>(
      'SELECT fileUri FROM offline_tracks WHERE id = ?',
      music.id,
    );

    await database.runAsync(
      `INSERT INTO offline_tracks
        (id, file_id, title, genre, addedAt, playlistIDs, fileUri, downloadedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         file_id = excluded.file_id,
         title = excluded.title,
         genre = excluded.genre,
         addedAt = excluded.addedAt,
         playlistIDs = excluded.playlistIDs,
         fileUri = excluded.fileUri,
         downloadedAt = excluded.downloadedAt`,
      music.id,
      music.file_id,
      music.title,
      music.genre ?? null,
      music.addedAt ?? null,
      JSON.stringify(music.playlistIDs ?? []),
      result.uri,
      new Date().toISOString(),
    );

    if (previous?.fileUri && previous.fileUri !== result.uri && previous.fileUri.startsWith(AUDIO_DIR)) {
      await FileSystem.deleteAsync(previous.fileUri, { idempotent: true }).catch(() => undefined);
    }

    return {
      ...music,
      fileUri: result.uri,
    };
  } catch (error) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true })
      .catch(() => undefined);

    throw error;
  }
}

export async function removeOfflineTrack(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("A valid track ID is required.");
  const database = await db();
  const row = await database.getFirstAsync<{ fileUri: string }>('SELECT fileUri FROM offline_tracks WHERE id = ?', id);
  await database.runAsync('DELETE FROM offline_tracks WHERE id = ?', id);
  if (row?.fileUri?.startsWith(AUDIO_DIR)) await FileSystem.deleteAsync(row.fileUri, { idempotent: true });
}

export async function getOfflineTrackUri(id: number): Promise<string | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const database = await db();
  const row = await database.getFirstAsync<{ fileUri: string }>('SELECT fileUri FROM offline_tracks WHERE id = ?', id);
  if (!row) return null;
  const info = await FileSystem.getInfoAsync(row.fileUri);
  return info.exists ? row.fileUri : null;
}