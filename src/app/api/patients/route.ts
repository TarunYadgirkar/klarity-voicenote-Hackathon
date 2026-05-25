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

  const patients = await sql`SELECT * FROM patients ORDER BY created_at DESC`;

  const result = await Promise.all(
    patients.map(async (p) => {
      const [call] = await sql`SELECT * FROM calls WHERE patient_id = ${p.id as string} ORDER BY created_at DESC LIMIT 1`;
      const [note] = call
        ? await sql`SELECT * FROM notes WHERE call_id = ${call.id as string} LIMIT 1`
        : [undefined];

      return {
        ...p,
        call_status: call?.status || 'pending',
        note_id: note?.id,
        note_status: note?.status,
        risk_level: note?.risk_level,
      };
    })
  );

  return NextResponse.json(result);
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
  }).catch(() => {});

  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId: callId2, transcript: DEMO_TRANSCRIPT, patientId: 'demo-patient-2' }),
  }).catch(() => {});
}
