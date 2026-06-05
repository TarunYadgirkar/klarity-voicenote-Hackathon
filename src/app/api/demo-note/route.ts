import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import getDb from '@/lib/db';
import { DEMO_TRANSCRIPT } from '@/lib/demo';

const DemoNoteSchema = z.object({
  callId: z.string().uuid(),
  patientId: z.string().max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = DemoNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { callId, patientId } = parsed.data;
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
