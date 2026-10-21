import * as SQLite from 'expo-sqlite';
import { apiFetch, responseError } from '@/services/apiClient';

export const SQLITE_EXPORT_TABLES = [
  'music',
  'playlist',
  'user',
  'userplaylist',
  'playlistmusics',
] as const;

export type ExportColumn = {
  name: string;
  /** PostgreSQL type name, e.g. integer, bigint, text, boolean, timestamp */
  dataType: string;
  nullable?: boolean;
};

export type ExportForeignKey = {
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
  onUpdate?: 'NO ACTION' | 'RESTRICT' | 'CASCADE' | 'SET NULL' | 'SET DEFAULT';
};

export type ExportTable = {
  name: (typeof SQLITE_EXPORT_TABLES)[number];
  columns: ExportColumn[];
  primaryKey?: string[];
  foreignKeys?: ExportForeignKey[];
  rows: Record<string, unknown>[];
};

export type SqliteExportPayload = {
  schemaVersion: number;
  tables: ExportTable[];
};

const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

function sqliteType(postgresType: string): 'INTEGER' | 'REAL' | 'BLOB' | 'TEXT' {
  const type = postgresType.toLowerCase();
  if (/^(smallint|integer|bigint|int2|int4|int8|serial|bigserial|boolean|bool)$/.test(type)) return 'INTEGER';
  if (/^(real|double precision|numeric|decimal|float4|float8|money)$/.test(type)) return 'REAL';
  if (/^(bytea|blob)$/.test(type)) return 'BLOB';
  return 'TEXT';
}

function validatePayload(payload: SqliteExportPayload): void {
  if (!payload || payload.schemaVersion !== 1 || !Array.isArray(payload.tables)) throw new Error('The export endpoint returned an unsupported or invalid schema.');
  const names = new Set(payload.tables.map(table => table.name));
  for (const required of SQLITE_EXPORT_TABLES) {
    if (!names.has(required)) throw new Error(`The server export is missing the "${required}" table.`);
  }
  if (names.size !== payload.tables.length) throw new Error('The export contains duplicate tables.');
  for (const table of payload.tables) {
    if (!(SQLITE_EXPORT_TABLES as readonly string[]).includes(table.name)) {
      throw new Error(`Unexpected table in export: ${table.name}`);
    }
    if (!Array.isArray(table.columns) || !Array.isArray(table.rows)) {
      throw new Error(`Invalid schema or rows for table "${table.name}".`);
    }
    const columnNames = new Set(table.columns.map(column => column.name));
    if (columnNames.size !== table.columns.length) throw new Error(`Duplicate columns in table "${table.name}".`);
    if (table.columns.length === 0) throw new Error(`Table "${table.name}" has no columns.`);
    if (table.primaryKey !== undefined && (!Array.isArray(table.primaryKey) || table.primaryKey.some(name => !columnNames.has(name)))) {
      throw new Error(`Invalid primary key definition in table "${table.name}".`);
    }
    if (table.foreignKeys !== undefined && !Array.isArray(table.foreignKeys)) {
      throw new Error(`Invalid foreign-key definition in table "${table.name}".`);
    }
    for (const column of table.columns) {
      if (!column.name || typeof column.name !== 'string' || typeof column.dataType !== 'string') {
        throw new Error(`Invalid column definition in table "${table.name}".`);
      }
    }
    for (const fk of table.foreignKeys ?? []) {
      if (!(SQLITE_EXPORT_TABLES as readonly string[]).includes(fk.referencedTable)) {
        throw new Error(`Unexpected foreign-key target in table "${table.name}".`);
      }
      if (!Array.isArray(fk.columns) || !Array.isArray(fk.referencedColumns) ||
          fk.columns.length === 0 || fk.columns.length !== fk.referencedColumns.length ||
          fk.columns.some(name => !columnNames.has(name))) {
        throw new Error(`Invalid foreign-key columns in table "${table.name}".`);
      }
    }
    for (const row of table.rows) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        throw new Error(`Invalid row in table "${table.name}".`);
      }
      for (const key of Object.keys(row)) {
        if (!columnNames.has(key)) throw new Error(`Unexpected column "${key}" in table "${table.name}".`);
      }
    }
  }
}

/** Fetches the server-side export and replaces the local snapshot transactionally. */
export async function createLocalMusicDatabase(): Promise<{ path: string; counts: Record<string, number> }> {
  // The backend derives the user identity from the signed-in bearer token.
  const response = await apiFetch('/api/mobile/sqlite-export');
  if (!response.ok) throw await responseError(response, 'SQLite export failed');
  const payload = (await response.json()) as SqliteExportPayload;
  validatePayload(payload);

  // Keep a single database file on the device. The tables are rebuilt together,
  // so a failed import rolls back rather than leaving a partially copied database.
  const db = await SQLite.openDatabaseAsync('music-library.db');
  const counts: Record<string, number> = {};
  const tables = SQLITE_EXPORT_TABLES.map(name => payload.tables.find(table => table.name === name)!);

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.withTransactionAsync(async () => {
      for (const table of [...tables].reverse()) {
        await db.execAsync(`DROP TABLE IF EXISTS ${quoteIdentifier(table.name)};`);
      }

      // Create all tables before inserting data, so FK references can point
      // to tables created later in the import order.
      for (const table of tables) {
        if (table.columns.length === 0) throw new Error(`Table "${table.name}" has no columns.`);
        const definitions = table.columns.map(column => {
          const nullable = column.nullable === false ? ' NOT NULL' : '';
          return `${quoteIdentifier(column.name)} ${sqliteType(column.dataType)}${nullable}`;
        });
        if (table.primaryKey?.length) {
          definitions.push(`PRIMARY KEY (${table.primaryKey.map(quoteIdentifier).join(', ')})`);
        }
        for (const fk of table.foreignKeys ?? []) {
          if (fk.columns.length !== fk.referencedColumns.length || fk.columns.length === 0) {
            throw new Error(`Invalid foreign key in table "${table.name}".`);
          }
          const allowedActions = new Set(['NO ACTION', 'RESTRICT', 'CASCADE', 'SET NULL', 'SET DEFAULT']);
          const onDelete = fk.onDelete && allowedActions.has(fk.onDelete) ? ` ON DELETE ${fk.onDelete}` : '';
          const onUpdate = fk.onUpdate && allowedActions.has(fk.onUpdate) ? ` ON UPDATE ${fk.onUpdate}` : '';
          definitions.push(
            `FOREIGN KEY (${fk.columns.map(quoteIdentifier).join(', ')}) REFERENCES ${quoteIdentifier(fk.referencedTable)} (${fk.referencedColumns.map(quoteIdentifier).join(', ')})${onDelete}${onUpdate}`,
          );
        }
        await db.execAsync(`CREATE TABLE ${quoteIdentifier(table.name)} (${definitions.join(', ')});`);
      }

      // Insert in dependency-friendly order. FK checks are enabled after import.
      for (const table of tables) {
        const columns = table.columns.map(column => column.name);
        const placeholders = columns.map(() => '?').join(', ');
        const insertSql = `INSERT INTO ${quoteIdentifier(table.name)} (${columns.map(quoteIdentifier).join(', ')}) VALUES (${placeholders})`;
        for (const row of table.rows) {
          const values = columns.map(column => {
            const value = row[column];
            if (value === undefined || value === null) return null;
            if (typeof value === 'boolean') return value ? 1 : 0;
            if (typeof value === 'object') return JSON.stringify(value);
            return value as SQLite.SQLiteBindValue;
          });
          await db.runAsync(insertSql, values as SQLite.SQLiteBindValue[]);
        }
        counts[table.name] = table.rows.length;
      }

      const violations = await db.getAllAsync<{ table: string; rowid: number | null; parent: string; fkid: number }>(
        'PRAGMA foreign_key_check;',
      );
      if (violations.length) {
        throw new Error(`Imported database has a foreign-key violation in table "${violations[0].table}".`);
      }
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

  const path = await db.getFirstAsync<{ file: string }>(`PRAGMA database_list;`);
  return { path: path?.file ?? 'music-library.db', counts };
}
