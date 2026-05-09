import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { DEMO_PATIENTS, DEMO_TRANSCRIPT } from '@/lib/demo';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const db = getDb();

  // Seed demo data if empty
  const count = (db.prepare('SELECT COUNT(*) as c FROM patients').get() as { c: number }).c;
  if (count === 0) {
    seedDemo(db);
  }

  const patients = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all() as Record<string, unknown>[];

  const result = patients.map((p) => {
    const call = db.prepare('SELECT * FROM calls WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1').get(p.id as string) as Record<string, unknown> | undefined;
    const note = call ? db.prepare('SELECT * FROM notes WHERE call_id = ? LIMIT 1').get(call.id as string) as Record<string, unknown> | undefined : undefined;

    return {
      ...p,
      call_status: call?.status || 'pending',
      note_id: note?.id,
      note_status: note?.status,
      risk_level: note?.risk_level,
    };
  });

  return NextResponse.json(result);
}

function seedDemo(db: ReturnType<typeof getDb>) {
  for (const p of DEMO_PATIENTS) {
    db.prepare(`
      INSERT OR IGNORE INTO patients (id, name, age_range, appointment_type, provider_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(p.id, p.name, p.age_range, p.appointment_type, 'Dr. Chen');
  }

  // First patient gets a completed call + note
  const callId = uuidv4();
  db.prepare(`
    INSERT OR IGNORE INTO calls (id, patient_id, retell_call_id, status, transcript, completed_at)
    VALUES (?, ?, ?, 'completed', ?, datetime('now'))
  `).run(callId, 'demo-patient-1', 'demo-call-1', DEMO_TRANSCRIPT);

  // Second patient gets completed call + note
  const callId2 = uuidv4();
  db.prepare(`
    INSERT OR IGNORE INTO calls (id, patient_id, retell_call_id, status, transcript, completed_at)
    VALUES (?, ?, ?, 'completed', ?, datetime('now'))
  `).run(callId2, 'demo-patient-2', 'demo-call-2', DEMO_TRANSCRIPT);

  // Third patient has no call (pending)

  // Generate notes for first two
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId, transcript: DEMO_TRANSCRIPT, patientId: 'demo-patient-1' }),
  }).catch(() => {});

  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId: callId2, transcript: DEMO_TRANSCRIPT, patientId: 'demo-patient-2' }),
  }).catch(() => {});
}
