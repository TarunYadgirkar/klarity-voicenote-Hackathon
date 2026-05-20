import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── mock db ───────────────────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockRun = vi.fn();
const mockPrepare = vi.fn(() => ({ get: mockGet, run: mockRun }));
vi.mock('@/lib/db', () => ({ default: () => ({ prepare: mockPrepare }) }));

// ── mock fetch (Gemini) ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { POST } = await import('./route');

// ── helpers ───────────────────────────────────────────────────────────────────
function makeReq(body: object) {
  return new NextRequest('http://localhost/api/generate-note', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const GEMINI_NOTE = {
  patient_summary: 'Summary',
  chief_concern: 'Anxiety',
  symptoms_reported: ['Chest tightness'],
  sleep_impact: '',
  mood_affect: '',
  stressors: [],
  medication_mentions: '',
  prior_care: '',
  patient_goals: ['Coping strategies'],
  soap_note: { subjective: 'S', objective: 'O', assessment: 'A', plan: 'P' },
  risk: { level: 'low', flags: [], urgent_provider_review: false, reason: '' },
  suggested_provider_questions: ['Question?'],
  follow_up_actions: ['Action'],
  missing_information: [],
};

function makeGeminiResponse(note = GEMINI_NOTE) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(note) }] } }],
      }),
  };
}

describe('POST /api/generate-note', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRun.mockReset();
    mockFetch.mockReset();
    vi.unstubAllEnvs();
  });

  it('returns 400 when neither transcript nor callId is provided', async () => {
    const res = await POST(makeReq({ patientId: 'p1' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('No transcript');
  });

  it('resolves transcript from DB when transcript is omitted but callId is present', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    // First get() returns the call record, second get() checks for existing note
    mockGet
      .mockReturnValueOnce({ transcript: 'Resolved transcript', patient_id: 'p1' })
      .mockReturnValueOnce(undefined); // no existing note
    const res = await POST(makeReq({ callId: 'call-1' }));
    expect(res.status).toBe(200);
  });

  it('returns 400 when callId exists but no matching call in DB', async () => {
    mockGet.mockReturnValue(undefined);
    const res = await POST(makeReq({ callId: 'nonexistent-call' }));
    expect(res.status).toBe(400);
  });

  it('uses demo note when GEMINI_API_KEY is not set', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    mockGet.mockReturnValue(undefined); // no existing note
    const res = await POST(makeReq({ transcript: 'Some text', callId: 'c1', patientId: 'p1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Demo note always returns 'low' risk
    expect(body.result.risk.level).toBe('low');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uses demo note when GEMINI_API_KEY is the placeholder string', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'your_gemini_api_key_here');
    mockGet.mockReturnValue(undefined);
    const res = await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('calls Gemini and returns its result when API key is set', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'real-gemini-key');
    mockFetch.mockResolvedValue(makeGeminiResponse());
    mockGet.mockReturnValue(undefined); // no existing note
    const res = await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('falls back to demo note when Gemini fetch throws', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'real-key');
    mockFetch.mockRejectedValue(new Error('Network error'));
    mockGet.mockReturnValue(undefined);
    const res = await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('INSERTs a new note when none exists for the callId', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    mockGet.mockReturnValue(undefined); // no existing note
    await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    const insertCall = mockRun.mock.calls.find((args) => args.includes('c1') && args.includes('p1'));
    expect(insertCall).toBeDefined();
  });

  it('UPDATEs an existing note when one already exists for the callId', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    mockGet.mockReturnValue({ id: 'existing-note-id' }); // existing note found
    await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    // UPDATE run() should be called with callId as the last arg
    const updateCall = mockRun.mock.calls.find((args) => args[args.length - 1] === 'c1');
    expect(updateCall).toBeDefined();
  });

  it("sets note status to 'urgent_review' when risk.urgent_provider_review is true", async () => {
    vi.stubEnv('GEMINI_API_KEY', 'real-key');
    const urgentNote = {
      ...GEMINI_NOTE,
      risk: { level: 'high', flags: ['Suicidal ideation'], urgent_provider_review: true, reason: 'Safety concern' },
    };
    mockFetch.mockResolvedValue(makeGeminiResponse(urgentNote));
    mockGet.mockReturnValue(undefined);
    await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    // The last arg of INSERT is the status value
    const insertArgs = mockRun.mock.calls[0];
    expect(insertArgs[insertArgs.length - 1]).toBe('urgent_review');
  });

  it("sets note status to 'ai_draft' when urgent_provider_review is false", async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    mockGet.mockReturnValue(undefined);
    await POST(makeReq({ transcript: 'Text', callId: 'c1', patientId: 'p1' }));
    const insertArgs = mockRun.mock.calls[0];
    expect(insertArgs[insertArgs.length - 1]).toBe('ai_draft');
  });
});
