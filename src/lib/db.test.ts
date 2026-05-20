import { describe, it, expect, afterEach } from 'vitest';

// Use an in-memory SQLite database for all tests
process.env.DB_PATH = ':memory:';

const { default: getDb } = await import('./db');

describe('Database module', () => {
  afterEach(() => {
    // Reset DB_PATH after each test to avoid polluting state
    process.env.DB_PATH = ':memory:';
  });

  it('creates the patients table', () => {
    const db = getDb(':memory:');
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='patients'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('patients');
  });

  it('creates the calls table', () => {
    const db = getDb(':memory:');
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='calls'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('calls');
  });

  it('creates the notes table', () => {
    const db = getDb(':memory:');
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('notes');
  });

  it('creates the consent_logs table', () => {
    const db = getDb(':memory:');
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='consent_logs'")
      .get() as { name: string } | undefined;
    expect(row?.name).toBe('consent_logs');
  });

  it('can insert and retrieve a patient', () => {
    const db = getDb(':memory:');
    db.prepare(
      "INSERT INTO patients (id, name) VALUES ('p-test', 'Test Patient')"
    ).run();
    const patient = db
      .prepare("SELECT * FROM patients WHERE id = 'p-test'")
      .get() as { id: string; name: string };
    expect(patient.name).toBe('Test Patient');
  });

  it('notes table defaults risk_level to none', () => {
    const db = getDb(':memory:');
    db.prepare("INSERT INTO patients (id, name) VALUES ('p1', 'Jane')").run();
    db.prepare("INSERT INTO calls (id, patient_id) VALUES ('c1', 'p1')").run();
    db.prepare(
      "INSERT INTO notes (id, patient_id, call_id) VALUES ('n1', 'p1', 'c1')"
    ).run();
    const note = db
      .prepare("SELECT risk_level FROM notes WHERE id = 'n1'")
      .get() as { risk_level: string };
    expect(note.risk_level).toBe('none');
  });

  it('notes table defaults status to ai_draft', () => {
    const db = getDb(':memory:');
    db.prepare("INSERT INTO patients (id, name) VALUES ('p2', 'Bob')").run();
    db.prepare("INSERT INTO calls (id, patient_id) VALUES ('c2', 'p2')").run();
    db.prepare(
      "INSERT INTO notes (id, patient_id, call_id) VALUES ('n2', 'p2', 'c2')"
    ).run();
    const note = db
      .prepare("SELECT status FROM notes WHERE id = 'n2'")
      .get() as { status: string };
    expect(note.status).toBe('ai_draft');
  });
});
