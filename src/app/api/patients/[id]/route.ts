import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = await getDb();

  // Delete in FK order: notes → consent_logs → calls → patients
  await sql`DELETE FROM notes WHERE patient_id = ${id}`;
  await sql`DELETE FROM consent_logs WHERE patient_id = ${id}`;
  await sql`DELETE FROM calls WHERE patient_id = ${id}`;
  await sql`DELETE FROM patients WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
