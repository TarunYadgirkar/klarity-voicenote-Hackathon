import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'retell-sdk';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signature = req.headers.get('x-retell-signature') ?? '';
  const apiKey = process.env.RETELL_API_KEY ?? '';

  const isValid = await verify(rawBody, apiKey, signature);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const event = body.event;
  const call = body.call as Record<string, unknown> | undefined;

  if (!call) {
    return NextResponse.json({ error: 'Missing call field' }, { status: 400 });
  }

  const sql = await getDb();
  const retellCallId = call.call_id as string;
  const [dbCall] = await sql`SELECT * FROM calls WHERE retell_call_id = ${retellCallId}`;

  if (!dbCall) {
    return NextResponse.json({ ok: true });
  }

  if (event === 'call_ended' || event === 'call_analyzed') {
    const transcript = (call.transcript as string) || '';
    const durationMs = call.duration_ms as number | undefined;
    const duration = durationMs ? Math.floor(durationMs / 1000) : null;

    await sql`
      UPDATE calls
      SET status = ${'completed'}, transcript = ${transcript}, duration_seconds = ${duration}, completed_at = NOW()
      WHERE id = ${dbCall.id}
    `;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const noteRes = await fetch(`${appUrl}/api/generate-note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: dbCall.id, transcript }),
      });
      if (!noteRes.ok) {
        console.error('generate-note failed from webhook:', noteRes.status);
      }
    } catch (err) {
      console.error('generate-note fetch error from webhook:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
