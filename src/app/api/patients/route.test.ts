import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── mock db ───────────────────────────────────────────────────────────────────
const mockAll = vi.fn();
const mockGet = vi.fn();
const mockRun = vi.fn();
const mockPrepare = vi.fn(() => ({ all: mockAll, get: mockGet, run: mockRun }));
vi.mock('@/lib/db', () => ({ default: () => ({ prepare: mockPrepare }) }));

// ── mock fetch used by seedDemo ───────────────────────────────────────────────
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

const { GET } = await import('./route');

describe('GET /api/patients', () => {
  beforeEach(() => {
    mockAll.mockReset();
    mockGet.mockReset();
    mockRun.mockReset();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it('returns patients with joined call and note data', async () => {
    // Patient count > 0 so no seeding
    mockGet
      .mockReturnValueOnce({ c: 2 }) // COUNT query
      .mockReturnValueOnce({ id: 'c1', status: 'completed' }) // call for patient 1
      .mockReturnValueOnce({ id: 'n1', status: 'ai_draft', risk_level: 'low' }) // note for call 1
      .mockReturnValueOnce({ id: 'c2', status: 'pending' }) // call for patient 2
      .mockReturnValueOnce(undefined); // no note for patient 2

    mockAll.mockReturnValue([
      { id: 'p1', name: 'Alice' },
      { id: 'p2', name: 'Bob' },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveLength(2);
    expect(body[0].call_status).toBe('completed');
    expect(body[0].note_id).toBe('n1');
    expect(body[0].note_status).toBe('ai_draft');
    expect(body[0].risk_level).toBe('low');
    expect(body[1].call_status).toBe('pending');
    expect(body[1].note_id).toBeUndefined();
  });

  it('shows call_status as pending for patients with no calls', async () => {
    mockGet
      .mockReturnValueOnce({ c: 1 }) // COUNT
      .mockReturnValueOnce(undefined); // no call for this patient

    mockAll.mockReturnValue([{ id: 'p3', name: 'Carol' }]);

    const res = await GET();
    const body = await res.json();
    expect(body[0].call_status).toBe('pending');
  });

  it('triggers demo seeding when patient count is zero', async () => {
    mockGet.mockReturnValue({ c: 0 }); // COUNT returns 0
    mockAll.mockReturnValue([]);

    await GET();

    // seedDemo calls INSERT OR IGNORE for each demo patient (3 patients)
    expect(mockRun).toHaveBeenCalled();
  });
});
