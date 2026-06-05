import { NextRequest, NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { z } from 'zod';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const CreateWebCallSchema = z.object({
  patientName: z.string().max(200),
  appointmentType: z.string().max(100),
  ageRange: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateWebCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { patientName, appointmentType, ageRange } = parsed.data;

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

  if (!retellApiKey || !agentId) {
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
    return NextResponse.json({ callId, patientId, demoMode: true, error: 'Internal server error' });
  }
}
