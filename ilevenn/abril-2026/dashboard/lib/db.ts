import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'betting.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      sport TEXT NOT NULL,
      league TEXT NOT NULL,
      event TEXT NOT NULL,
      market TEXT NOT NULL,
      selection TEXT NOT NULL,
      odds REAL NOT NULL,
      stake REAL NOT NULL,
      units REAL NOT NULL DEFAULT 1,
      result TEXT NOT NULL DEFAULT 'pending',
      profit REAL DEFAULT 0,
      tipster TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      value_bet INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bankroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tipsters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sport TEXT DEFAULT 'Multiple',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed initial bankroll if empty
  const bankrollCount = db.prepare('SELECT COUNT(*) as count FROM bankroll').get() as { count: number };
  if (bankrollCount.count === 0) {
    db.prepare('INSERT INTO bankroll (amount, date, description) VALUES (?, ?, ?)').run(
      1000,
      new Date().toISOString().split('T')[0],
      'Bankroll inicial'
    );
  }
}
