import * as SQLite from 'expo-sqlite';

export const databasePromise = SQLite.openDatabaseAsync('music.db');

export async function initializeDatabase() {
  const db = await databasePromise;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      genre TEXT NOT NULL DEFAULT '',
      addedAt TEXT NOT NULL DEFAULT '',
      playlistIDs TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL
    );
  `);

  return db;
}