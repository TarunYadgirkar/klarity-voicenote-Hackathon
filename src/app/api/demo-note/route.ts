import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { DEMO_TRANSCRIPT } from '@/lib/demo';

// One-shot endpoint: generate a note from demo transcript for a given callId
export async function POST(req: NextRequest) {
  const { callId, patientId } = await req.json();
  const db = getDb();

  // Update call with demo transcript
  db.prepare(`UPDATE calls SET transcript = ?, status = 'completed', completed_at = datetime('now') WHERE id = ?`)
    .run(DEMO_TRANSCRIPT, callId);

  // Trigger note generation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const res = await fetch(`${appUrl}/api/generate-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callId, transcript: DEMO_TRANSCRIPT, patientId }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
