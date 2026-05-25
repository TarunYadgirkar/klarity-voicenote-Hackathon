import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sql = await getDb();

  const event = body.event;
  const call = body.call;

  if (!call) {
    return NextResponse.json({ ok: true });
  }

  const retellCallId = call.call_id;
  const [dbCall] = await sql`SELECT * FROM calls WHERE retell_call_id = ${retellCallId}` as { id: string; patient_id: string }[] | undefined[];

  if (!dbCall) {
    return NextResponse.json({ ok: true });
  }

  if (event === 'call_ended' || event === 'call_analyzed') {
    const transcript = call.transcript || '';
    const duration = call.duration_ms ? Math.floor(call.duration_ms / 1000) : null;

    await sql`
      UPDATE calls
      SET status = ${'completed'}, transcript = ${transcript}, duration_seconds = ${duration}, completed_at = NOW()
      WHERE id = ${dbCall.id}
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/generate-note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId: dbCall.id, transcript }),
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}
