import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'klarity.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
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
