import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import getDb from '@/lib/db';

const PatchNoteSchema = z.object({
  status: z.enum(['reviewed', 'urgent_review', 'ai_draft']),
  riskLevel: z.enum(['none', 'low', 'medium', 'high']).optional(),
  providerEditedNote: z.string().max(10000).optional(),
});

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
  const body = await req.json();
  const parsed = PatchNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { status, providerEditedNote, riskLevel } = parsed.data;
  const sql = await getDb();

  await sql`
    UPDATE notes
    SET
      status = ${status},
      provider_edited_note = ${providerEditedNote ?? null},
      reviewed_at = NOW(),
      risk_level = COALESCE(${riskLevel ?? null}, risk_level)
    WHERE id = ${id}
  `;

  const [note] = await sql`SELECT * FROM notes WHERE id = ${id}`;
  return NextResponse.json(parseNote(note as Record<string, unknown>));
}

function parseNote(note: Record<string, unknown>) {
  function safeParseArray(value: unknown): unknown[] {
    try {
      const parsed = JSON.parse((value as string) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return {
    ...note,
    risk_flags: safeParseArray(note.risk_flags),
    suggested_questions: safeParseArray(note.suggested_questions),
    follow_up_actions: safeParseArray(note.follow_up_actions),
    symptoms_reported: safeParseArray(note.symptoms_reported),
    patient_goals: safeParseArray(note.patient_goals),
  };
}
