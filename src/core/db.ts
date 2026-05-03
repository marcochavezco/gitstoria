import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const DIR = join(homedir(), '.gitstoria');
const DB_PATH = join(DIR, 'sessions.db');

let db: Database.Database | null = null;

export function getOrInitDb(): Database.Database {
  if (!db) {
    initDb();
  }
  return db!;
}

export function initDb(): void {
  if (!existsSync(DIR)) {
    mkdirSync(DIR, { recursive: true });
  }
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_commits (
      id INTEGER PRIMARY KEY,
      repo_path TEXT NOT NULL,
      commit_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS session_logs (
      id INTEGER PRIMARY KEY,
      repo_path TEXT NOT NULL,
      commit_hash_start TEXT NOT NULL,
      commit_hash_end TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized. Call initDb() first.');
  return db;
}
