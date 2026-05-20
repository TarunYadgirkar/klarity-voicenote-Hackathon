import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── mock db ──────────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockRun = vi.fn();
const mockPrepare = vi.fn(() => ({ get: mockGet, run: mockRun }));
vi.mock('@/lib/db', () => ({ default: () => ({ prepare: mockPrepare }) }));

// Import after mocks are in place
const { GET, PATCH } = await import('./route');

// ── helpers ───────────────────────────────────────────────────────────────────
function makeReq(method: string, body?: object) {
  return new NextRequest(`http://localhost/api/notes/test-id`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ── parseNote (unit) ──────────────────────────────────────────────────────────
describe('parseNote', () => {
  const rawNote = {
    id: 'n1',
    ai_summary: 'Patient reports anxiety',
    risk_level: 'low',
    risk_flags: '["Sleep disruption"]',
    suggested_questions: '["How often do episodes occur?"]',
    follow_up_actions: '["PHQ-9 screening"]',
    symptoms_reported: '["Chest tightness"]',
    patient_goals: '["Develop coping strategies"]',
    status: 'ai_draft',
  };

  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockReturnValue(rawNote);
  });

  it('parses all JSON array fields correctly', async () => {
    const res = await GET(makeReq('GET'), makeParams('n1'));
    const body = await res.json();
    expect(body.risk_flags).toEqual(['Sleep disruption']);
    expect(body.suggested_questions).toEqual(['How often do episodes occur?']);
    expect(body.follow_up_actions).toEqual(['PHQ-9 screening']);
    expect(body.symptoms_reported).toEqual(['Chest tightness']);
    expect(body.patient_goals).toEqual(['Develop coping strategies']);
  });

  it('falls back to [] for null JSON fields', async () => {
    mockGet.mockReturnValue({
      ...rawNote,
      risk_flags: null,
      suggested_questions: null,
      follow_up_actions: null,
      symptoms_reported: null,
      patient_goals: null,
    });
    const res = await GET(makeReq('GET'), makeParams('n1'));
    const body = await res.json();
    expect(body.risk_flags).toEqual([]);
    expect(body.suggested_questions).toEqual([]);
    expect(body.follow_up_actions).toEqual([]);
    expect(body.symptoms_reported).toEqual([]);
    expect(body.patient_goals).toEqual([]);
  });

  it('passes through non-JSON fields unchanged', async () => {
    const res = await GET(makeReq('GET'), makeParams('n1'));
    const body = await res.json();
    expect(body.id).toBe('n1');
    expect(body.ai_summary).toBe('Patient reports anxiety');
    expect(body.status).toBe('ai_draft');
  });
});

// ── GET ───────────────────────────────────────────────────────────────────────
describe('GET /api/notes/[id]', () => {
  beforeEach(() => mockGet.mockReset());

  it('returns 404 when note is not found', async () => {
    mockGet.mockReturnValue(undefined);
    const res = await GET(makeReq('GET'), makeParams('nonexistent'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });

  it('returns 200 with the parsed note when found', async () => {
    mockGet.mockReturnValue({
      id: 'n1',
      risk_flags: '[]',
      suggested_questions: '[]',
      follow_up_actions: '[]',
      symptoms_reported: '[]',
      patient_goals: '[]',
    });
    const res = await GET(makeReq('GET'), makeParams('n1'));
    expect(res.status).toBe(200);
  });
});

// ── PATCH ─────────────────────────────────────────────────────────────────────
describe('PATCH /api/notes/[id]', () => {
  const updatedNote = {
    id: 'n1',
    status: 'reviewed',
    provider_edited_note: 'Provider correction',
    risk_flags: '[]',
    suggested_questions: '[]',
    follow_up_actions: '[]',
    symptoms_reported: '[]',
    patient_goals: '[]',
  };

  beforeEach(() => {
    mockRun.mockReset();
    mockGet.mockReset();
    mockGet.mockReturnValue(updatedNote);
  });

  it('runs the UPDATE statement with provided status and note', async () => {
    const req = makeReq('PATCH', { status: 'reviewed', providerEditedNote: 'Provider correction' });
    await PATCH(req, makeParams('n1'));
    expect(mockRun).toHaveBeenCalledWith('reviewed', 'Provider correction', 'n1');
  });

  it("defaults status to 'reviewed' when not provided", async () => {
    const req = makeReq('PATCH', { providerEditedNote: 'Some note' });
    await PATCH(req, makeParams('n1'));
    expect(mockRun).toHaveBeenCalledWith('reviewed', 'Some note', 'n1');
  });

  it('sets provider_edited_note to null when not provided', async () => {
    const req = makeReq('PATCH', { status: 'reviewed' });
    await PATCH(req, makeParams('n1'));
    expect(mockRun).toHaveBeenCalledWith('reviewed', null, 'n1');
  });

  it('returns the updated note', async () => {
    const req = makeReq('PATCH', { status: 'reviewed' });
    const res = await PATCH(req, makeParams('n1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('reviewed');
  });
});
