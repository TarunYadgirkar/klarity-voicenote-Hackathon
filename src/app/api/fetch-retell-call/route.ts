// PRIMARY trigger for note generation after a live Retell call.
// Called client-side immediately when the browser fires call_ended.
// More reliable than waiting for the Retell webhook.

import { NextRequest, NextResponse } from 'next/server';
import Retell from 'retell-sdk';
import { z } from 'zod';
import getDb from '@/lib/db';

const FetchRetellCallSchema = z.object({
  retellCallId: z.string().max(200),
  callId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = FetchRetellCallSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { retellCallId, callId } = parsed.data;

  const retellApiKey = process.env.RETELL_API_KEY;
  if (!retellApiKey) {
    return NextResponse.json({ error: 'Retell not configured' }, { status: 400 });
  }

  const sql = await getDb();

  let [dbCall] = await sql`SELECT * FROM calls WHERE retell_call_id = ${retellCallId}`;

  if (!dbCall && callId) {
    [dbCall] = await sql`SELECT * FROM calls WHERE id = ${callId}`;
    if (dbCall && retellCallId) {
      await sql`UPDATE calls SET retell_call_id = ${retellCallId} WHERE id = ${callId}`;
    }
  }

  if (!dbCall) {
    return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
  }

  try {
    const client = new Retell({ apiKey: retellApiKey });

    let callDetails;
    for (let attempt = 0; attempt < 3; attempt++) {
      callDetails = await client.call.retrieve(retellCallId);
      if (callDetails.transcript) break;
      await new Promise((r) => setTimeout(r, 3000));
    }

    const transcript = callDetails?.transcript || '';
    const durationMs = (callDetails as unknown as Record<string, unknown>)?.duration_ms as number | undefined;
    const duration = durationMs ? Math.floor(durationMs / 1000) : null;

    await sql`
      UPDATE calls
      SET status = ${'completed'}, transcript = ${transcript}, duration_seconds = ${duration}, completed_at = NOW()
      WHERE id = ${dbCall.id}
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const noteRes = await fetch(`${appUrl}/api/generate-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: dbCall.id, transcript, patientId: dbCall.patient_id }),
    });

    let noteId: string | undefined;
    if (noteRes.ok) {
      const noteData = await noteRes.json();
      noteId = noteData.noteId;
    } else {
      console.error('generate-note failed:', noteRes.status, await noteRes.text());
    }
    return NextResponse.json({ ok: true, callId: dbCall.id, noteId, hasTranscript: !!transcript });
  } catch (err) {
    console.error('fetch-retell-call error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
