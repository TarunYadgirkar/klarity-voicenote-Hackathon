import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!note) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(parseNote(note));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status, providerEditedNote } = await req.json();
  const db = getDb();

  db.prepare(`
    UPDATE notes
    SET status = ?, provider_edited_note = ?, reviewed_at = datetime('now')
    WHERE id = ?
  `).run(status || 'reviewed', providerEditedNote || null, id);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return NextResponse.json(parseNote(note!));
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
