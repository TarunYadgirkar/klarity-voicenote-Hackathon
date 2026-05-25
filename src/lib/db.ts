import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;
let initialized = false;
let initPromise: Promise<void> | null = null;

function getClient() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL!);
  }
  return sql;
}

async function initSchema() {
  const db = getClient();
  await db`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age_range TEXT,
      appointment_type TEXT,
      provider_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      retell_call_id TEXT,
      status TEXT DEFAULT 'pending',
      transcript TEXT,
      duration_seconds INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;
  await db`
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
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS consent_logs (
      id TEXT PRIMARY KEY,
      patient_id TEXT REFERENCES patients(id),
      consented INTEGER DEFAULT 0,
      consented_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

type SqlClient = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>;

export async function getDb(): Promise<SqlClient> {
  if (!initialized) {
    if (!initPromise) {
      initPromise = initSchema().then(() => {
        initialized = true;
      });
    }
    await initPromise;
  }
  return getClient() as unknown as SqlClient;
}

export default getDb;
