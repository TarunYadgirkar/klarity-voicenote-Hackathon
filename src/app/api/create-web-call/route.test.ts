import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── mock db ───────────────────────────────────────────────────────────────────
const mockRun = vi.fn();
const mockPrepare = vi.fn(() => ({ run: mockRun }));
vi.mock('@/lib/db', () => ({ default: () => ({ prepare: mockPrepare }) }));

// ── mock retell-sdk ───────────────────────────────────────────────────────────
const mockCreateWebCall = vi.fn();
vi.mock('retell-sdk', () => {
  function RetellMock(this: { call: { createWebCall: typeof mockCreateWebCall } }) {
    this.call = { createWebCall: mockCreateWebCall };
  }
  return { default: RetellMock };
});

const { POST } = await import('./route');

// ── helpers ───────────────────────────────────────────────────────────────────
function makeReq(body: object) {
  return new NextRequest('http://localhost/api/create-web-call', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const VALID_BODY = { patientName: 'Jane Doe', appointmentType: 'Initial Eval', ageRange: '25-34' };

describe('POST /api/create-web-call', () => {
  beforeEach(() => {
    mockRun.mockReset();
    mockCreateWebCall.mockReset();
    vi.unstubAllEnvs();
  });

  it('inserts a patient and a pending call into the database', async () => {
    await POST(makeReq(VALID_BODY));
    // First prepare().run() is the patient insert, second is the call insert
    expect(mockRun).toHaveBeenCalledTimes(2);
    const [patientArgs] = mockRun.mock.calls[0];
    expect(patientArgs).toMatch(/^[0-9a-f-]{36}$/); // UUID
  });

  it('returns demoMode:true when RETELL_API_KEY is not set', async () => {
    vi.stubEnv('RETELL_API_KEY', '');
    const res = await POST(makeReq(VALID_BODY));
    const body = await res.json();
    expect(body.demoMode).toBe(true);
    expect(body.callId).toBeDefined();
    expect(body.patientId).toBeDefined();
  });

  it('returns demoMode:true when RETELL_API_KEY is the placeholder value', async () => {
    vi.stubEnv('RETELL_API_KEY', 'your_retell_api_key');
    vi.stubEnv('RETELL_AGENT_ID', 'agent-123');
    const res = await POST(makeReq(VALID_BODY));
    const body = await res.json();
    expect(body.demoMode).toBe(true);
  });

  it('returns demoMode:true when Retell SDK throws', async () => {
    vi.stubEnv('RETELL_API_KEY', 'real-key');
    vi.stubEnv('RETELL_AGENT_ID', 'agent-123');
    mockCreateWebCall.mockRejectedValue(new Error('Network error'));
    const res = await POST(makeReq(VALID_BODY));
    const body = await res.json();
    expect(body.demoMode).toBe(true);
  });

  it('returns accessToken and demoMode:false on successful Retell call', async () => {
    vi.stubEnv('RETELL_API_KEY', 'real-key');
    vi.stubEnv('RETELL_AGENT_ID', 'agent-123');
    mockCreateWebCall.mockResolvedValue({ call_id: 'r-call-99', access_token: 'tok-abc' });
    const res = await POST(makeReq(VALID_BODY));
    const body = await res.json();
    expect(body.demoMode).toBe(false);
    expect(body.accessToken).toBe('tok-abc');
  });

  it('updates the call record with retell_call_id and in_progress status after success', async () => {
    vi.stubEnv('RETELL_API_KEY', 'real-key');
    vi.stubEnv('RETELL_AGENT_ID', 'agent-123');
    mockCreateWebCall.mockResolvedValue({ call_id: 'r-call-99', access_token: 'tok-abc' });
    await POST(makeReq(VALID_BODY));
    // Third run() is the UPDATE after Retell success
    expect(mockRun).toHaveBeenCalledTimes(3);
    const updateArgs = mockRun.mock.calls[2];
    expect(updateArgs).toContain('r-call-99');
  });
});
