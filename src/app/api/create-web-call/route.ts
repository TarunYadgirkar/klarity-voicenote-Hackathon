import { NextRequest, NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { patientName, appointmentType, ageRange } = await req.json();

  const patientId = uuidv4();
  const callId = uuidv4();
  const db = getDb();

  db.prepare(`
    INSERT INTO patients (id, name, age_range, appointment_type, provider_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(patientId, patientName, ageRange || null, appointmentType, 'Dr. Chen');

  db.prepare(`
    INSERT INTO calls (id, patient_id, status)
    VALUES (?, ?, 'pending')
  `).run(callId, patientId);

  const retellApiKey = process.env.RETELL_API_KEY;
  const agentId = process.env.RETELL_AGENT_ID;

  if (!retellApiKey || !agentId || retellApiKey === 'your_retell_api_key') {
    return NextResponse.json({
      callId,
      patientId,
      demoMode: true,
      message: 'Demo mode: Retell not configured',
    });
  }

  try {
    const client = new Retell({ apiKey: retellApiKey });
    const webCall = await client.call.createWebCall({
      agent_id: agentId,
      metadata: { patientId, callId, patientName, appointmentType },
    });

    db.prepare(`
      UPDATE calls SET retell_call_id = ?, status = 'in_progress' WHERE id = ?
    `).run(webCall.call_id, callId);

    return NextResponse.json({
      callId,
      patientId,
      retellCallId: webCall.call_id,
      accessToken: webCall.access_token,
      demoMode: false,
    });
  } catch (err) {
    console.error('Retell error:', err);
    return NextResponse.json({ callId, patientId, demoMode: true, error: String(err) });
  }
}
