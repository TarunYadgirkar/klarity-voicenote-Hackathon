import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { DEMO_TRANSCRIPT } from '@/lib/demo';

// One-shot endpoint: generate a note from demo transcript for a given callId
export async function POST(req: NextRequest) {
  const { callId, patientId } = await req.json();
  const sql = await getDb();

  await sql`
    UPDATE calls SET transcript = ${DEMO_TRANSCRIPT}, status = ${'completed'}, completed_at = NOW()
    WHERE id = ${callId}
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${appUrl}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId, transcript: DEMO_TRANSCRIPT, patientId }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
