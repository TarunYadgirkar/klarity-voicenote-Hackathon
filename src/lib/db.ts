import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DEFAULT_DB_PATH = path.join(DB_DIR, 'klarity.db');

// Singleton cache per resolved path; :memory: is always ephemeral
const connections = new Map<string, Database.Database>();

function getDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? process.env.DB_PATH ?? DEFAULT_DB_PATH;

  // :memory: databases cannot be meaningfully shared; always return a fresh one
  if (resolvedPath === ':memory:') {
    const conn = new Database(':memory:');
    initSchema(conn);
    return conn;
  }

  if (connections.has(resolvedPath)) {
    return connections.get(resolvedPath)!;
  }

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const conn = new Database(resolvedPath);
  conn.pragma('journal_mode = WAL');
  initSchema(conn);
  connections.set(resolvedPath, conn);
  return conn;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age_range TEXT,
      appointment_type TEXT,
      provider_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      retell_call_id TEXT,
      status TEXT DEFAULT 'pending',
      transcript TEXT,
      duration_seconds INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      call_id TEXT REFERENCES calls(id),
      ai_summary TEXT,
      soap_subjective TEXT,
      soap_objective TEXT,
      soap_assessment TEXT,
      soap_plan TEXT,
      risk_level TEXT DEFAULT 'none',
      risk_flags TEXT DEFAULT '[]',
      suggested_questions TEXT DEFAULT '[]',
      follow_up_actions TEXT DEFAULT '[]',
      chief_concern TEXT,
      symptoms_reported TEXT DEFAULT '[]',
      patient_goals TEXT DEFAULT '[]',
      status TEXT DEFAULT 'ai_draft',
      provider_edited_note TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consent_logs (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      consented INTEGER DEFAULT 0,
      consented_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

export default getDb;
