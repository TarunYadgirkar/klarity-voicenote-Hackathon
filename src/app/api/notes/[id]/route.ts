import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = await getDb();
  const [note] = await sql`SELECT * FROM notes WHERE id = ${id}`;

  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(parseNote(note as Record<string, unknown>));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, providerEditedNote, riskLevel } = await req.json();
  const sql = await getDb();

  await sql`
    UPDATE notes
    SET
      status = ${status || 'reviewed'},
      provider_edited_note = ${providerEditedNote || null},
      reviewed_at = NOW(),
      risk_level = COALESCE(${riskLevel || null}, risk_level)
    WHERE id = ${id}
  `;

  const [note] = await sql`SELECT * FROM notes WHERE id = ${id}`;
  return NextResponse.json(parseNote(note as Record<string, unknown>));
}

function parseNote(note: Record<string, unknown>) {
  return {
    ...note,
    risk_flags: JSON.parse((note.risk_flags as string) || '[]'),
    suggested_questions: JSON.parse((note.suggested_questions as string) || '[]'),
    follow_up_actions: JSON.parse((note.follow_up_actions as string) || '[]'),
    symptoms_reported: JSON.parse((note.symptoms_reported as string) || '[]'),
    patient_goals: JSON.parse((note.patient_goals as string) || '[]'),
  };
}
