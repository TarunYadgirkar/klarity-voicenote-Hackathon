import { NextRequest, NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { patientName, appointmentType, ageRange } = await req.json();

  const patientId = uuidv4();
  const callId = uuidv4();
  const sql = await getDb();

  await sql`
    INSERT INTO patients (id, name, age_range, appointment_type, provider_name)
    VALUES (${patientId}, ${patientName}, ${ageRange || null}, ${appointmentType}, ${'Dr. Chen'})
  `;

  await sql`
    INSERT INTO calls (id, patient_id, status)
    VALUES (${callId}, ${patientId}, ${'pending'})
  `;

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

    await sql`
      UPDATE calls SET retell_call_id = ${webCall.call_id}, status = ${'in_progress'} WHERE id = ${callId}
    `;

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
