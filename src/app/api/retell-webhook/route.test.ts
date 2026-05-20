import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── mock db ───────────────────────────────────────────────────────────────────
const mockRun = vi.fn();
const mockGet = vi.fn();
const mockPrepare = vi.fn(() => ({ run: mockRun, get: mockGet }));
vi.mock('@/lib/db', () => ({ default: () => ({ prepare: mockPrepare }) }));

// ── mock fetch ────────────────────────────────────────────────────────────────
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('./route');

// ── helpers ───────────────────────────────────────────────────────────────────
function makeReq(body: object) {
  return new NextRequest('http://localhost/api/retell-webhook', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const RETELL_CALL_ID = 'retell-abc-123';
const DB_CALL = { id: 'db-call-1', patient_id: 'patient-1' };

describe('POST /api/retell-webhook', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRun.mockReset();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('returns ok and does nothing when call is absent', async () => {
    const res = await POST(makeReq({ event: 'call_ended' }));
    expect(res.status).toBe(200);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('returns ok and does nothing when retell_call_id has no matching DB record', async () => {
    mockGet.mockReturnValue(undefined);
    const res = await POST(makeReq({ event: 'call_ended', call: { call_id: 'unknown-id' } }));
    expect(res.status).toBe(200);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('updates call to completed and stores transcript on call_ended', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_ended',
      call: { call_id: RETELL_CALL_ID, transcript: 'Patient said hello.', duration_ms: 90000 },
    });
    await POST(req);
    expect(mockRun).toHaveBeenCalledWith('Patient said hello.', 90, 'db-call-1');
  });

  it('handles call_analyzed event the same as call_ended', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_analyzed',
      call: { call_id: RETELL_CALL_ID, transcript: 'Transcript text', duration_ms: 60000 },
    });
    await POST(req);
    expect(mockRun).toHaveBeenCalledWith('Transcript text', 60, 'db-call-1');
  });

  it('converts duration_ms to integer seconds via floor division', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_ended',
      call: { call_id: RETELL_CALL_ID, transcript: '', duration_ms: 75999 },
    });
    await POST(req);
    expect(mockRun).toHaveBeenCalledWith('', 75, 'db-call-1');
  });

  it('stores null duration when duration_ms is absent', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_ended',
      call: { call_id: RETELL_CALL_ID, transcript: '' },
    });
    await POST(req);
    expect(mockRun).toHaveBeenCalledWith('', null, 'db-call-1');
  });

  it('does not update DB for unrecognised event types', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_started',
      call: { call_id: RETELL_CALL_ID },
    });
    await POST(req);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('fires async fetch to /api/generate-note on call_ended', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_ended',
      call: { call_id: RETELL_CALL_ID, transcript: 'hello' },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate-note'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('db-call-1'),
      })
    );
  });

  it('fires async fetch to /api/generate-note on call_analyzed', async () => {
    mockGet.mockReturnValue(DB_CALL);
    const req = makeReq({
      event: 'call_analyzed',
      call: { call_id: RETELL_CALL_ID, transcript: 'text' },
    });
    await POST(req);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate-note'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});
