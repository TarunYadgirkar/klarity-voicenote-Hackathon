import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { DEMO_PATIENTS, DEMO_TRANSCRIPT } from '@/lib/demo';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const sql = await getDb();

  const [{ c }] = await sql`SELECT COUNT(*) as c FROM patients`;
  if (Number(c) === 0) {
    await seedDemo(sql);
  }

  const rows = await sql`
    SELECT
      p.*,
      COALESCE(c.status, 'pending') AS call_status,
      n.id        AS note_id,
      n.status    AS note_status,
      n.risk_level
    FROM patients p
    LEFT JOIN LATERAL (
      SELECT id, status FROM calls
      WHERE patient_id = p.id
      ORDER BY created_at DESC LIMIT 1
    ) c ON true
    LEFT JOIN LATERAL (
      SELECT id, status, risk_level FROM notes
      WHERE call_id = c.id LIMIT 1
    ) n ON true
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json(rows);
}

async function seedDemo(sql: Awaited<ReturnType<typeof getDb>>) {
  for (const p of DEMO_PATIENTS) {
    await sql`
      INSERT INTO patients (id, name, age_range, appointment_type, provider_name)
      VALUES (${p.id}, ${p.name}, ${p.age_range}, ${p.appointment_type}, ${'Dr. Chen'})
      ON CONFLICT DO NOTHING
    `;
  }

  const callId = uuidv4();
  await sql`
    INSERT INTO calls (id, patient_id, retell_call_id, status, transcript, completed_at)
    VALUES (${callId}, ${'demo-patient-1'}, ${'demo-call-1'}, ${'completed'}, ${DEMO_TRANSCRIPT}, NOW())
    ON CONFLICT DO NOTHING
  `;

  const callId2 = uuidv4();
  await sql`
    INSERT INTO calls (id, patient_id, retell_call_id, status, transcript, completed_at)
    VALUES (${callId2}, ${'demo-patient-2'}, ${'demo-call-2'}, ${'completed'}, ${DEMO_TRANSCRIPT}, NOW())
    ON CONFLICT DO NOTHING
  `;

  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId, transcript: DEMO_TRANSCRIPT, patientId: 'demo-patient-1' }),
  }).catch((err) => console.error('generate-note seed failed for demo-patient-1:', err));

  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId: callId2, transcript: DEMO_TRANSCRIPT, patientId: 'demo-patient-2' }),
  }).catch((err) => console.error('generate-note seed failed for demo-patient-2:', err));
}
