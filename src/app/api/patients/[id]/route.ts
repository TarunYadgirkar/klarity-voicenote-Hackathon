import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = await getDb();

  await sql.transaction(txn => [
    txn`DELETE FROM notes WHERE patient_id = ${id}`,
    txn`DELETE FROM consent_logs WHERE patient_id = ${id}`,
    txn`DELETE FROM calls WHERE patient_id = ${id}`,
    txn`DELETE FROM patients WHERE id = ${id}`,
  ]);

  return NextResponse.json({ ok: true });
}
