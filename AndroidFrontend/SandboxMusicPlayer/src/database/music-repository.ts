import { databasePromise } from './database';
import { Music } from '@/types/music';

export async function saveMusicLocally(music: Music[]) {
  const db = await databasePromise;

  await db.withTransactionAsync(async () => {
    for (const item of music) {
      await db.runAsync(
        `INSERT INTO music
          (id, title, genre, addedAt, playlistIDs)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title = excluded.title,
           genre = excluded.genre,
           addedAt = excluded.addedAt,
           playlistIDs = excluded.playlistIDs`,
        item.id,
        item.title,
        item.genre,
        item.addedAt,
        JSON.stringify(item.playlistIDs)
      );
    }
  });
}

export async function getLocalMusic(): Promise<Music[]> {
  const db = await databasePromise;

  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    genre: string;
    addedAt: string;
    playlistIDs: string;
  }>(
    'SELECT * FROM music ORDER BY id DESC'
  );

  return rows.map((row) => new Music({
    ...row,
    playlistIDs: JSON.parse(row.playlistIDs) as number[],
  }));
}