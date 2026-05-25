'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Note {
  id: string;
  patient_id: string;
  call_id: string;
  ai_summary: string;
  soap_subjective: string;
  soap_objective: string;
  soap_assessment: string;
  soap_plan: string;
  risk_level: string;
  risk_flags: string[];
  suggested_questions: string[];
  follow_up_actions: string[];
  chief_concern: string;
  symptoms_reported: string[];
  patient_goals: string[];
  status: string;
  provider_edited_note?: string;
  reviewed_at?: string;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-green-50 text-green-600 border-green-200',
  none: 'bg-slate-100 text-slate-500 border-slate-200',
};

const RISK_ACTIVE: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border-red-300 ring-2 ring-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-300 ring-2 ring-amber-200',
  low: 'bg-green-50 text-green-600 border-green-300 ring-2 ring-green-200',
  none: 'bg-slate-100 text-slate-600 border-slate-300 ring-2 ring-slate-200',
};

function buildSoapText(n: Note) {
  return `AI Draft — Provider Review Required

Patient Summary:
${n.ai_summary || ''}

Chief Concern:
${n.chief_concern || ''}

Patient-Reported Symptoms:
${(n.symptoms_reported || []).map((s) => `- ${s}`).join('\n')}

SOAP Note Draft:
S — Subjective:
${n.soap_subjective || ''}

O — Objective:
${n.soap_objective || ''}

A — Assessment:
${n.soap_assessment || ''}

P — Plan:
${n.soap_plan || ''}`;
}

export default function NoteDetailPage({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [riskSaving, setRiskSaving] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/notes/${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
        setEditedNote(data.provider_edited_note || buildSoapText(data));
      }
      setLoading(false);
    }
    load();
  }, [noteId]);

  async function loadTranscript() {
    if (!note?.call_id) return;
    const res = await fetch(`/api/calls/${note.call_id}`);
    if (res.ok) {
      const data = await res.json();
      setTranscript(data.transcript);
    }
    setShowTranscript(true);
  }

  async function updateRisk(level: string) {
    if (!note || riskSaving) return;
    setRiskSaving(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: note.status, riskLevel: level }),
    });
    if (res.ok) { const data = await res.json(); setNote(data); }
    setRiskSaving(false);
  }

  async function approve() {
    setSaving(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed', providerEditedNote: editedNote }),
    });
    if (res.ok) { const data = await res.json(); setNote(data); }
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
        Loading note...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-[#64748B]">
        Note not found.{' '}
        <Link href="/dashboard" className="text-[#00B894] ml-2 font-medium">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-[#00B894] tracking-tight">Klarity VoiceNote</Link>
        <Link href="/dashboard" className="text-sm text-[#64748B] hover:text-[#00B894] transition-colors font-medium">
          ← Dashboard
        </Link>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {/* Risk toggle */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {(['none', 'low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateRisk(level)}
                    disabled={riskSaving}
                    className={`text-xs font-semibold px-3 py-1 rounded-full border capitalize transition-all ${
                      note.risk_level === level
                        ? RISK_ACTIVE[level] || RISK_ACTIVE.none
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#00B894]/40 hover:text-[#00B894]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  note.status === 'reviewed' ? 'bg-green-50 text-green-600' :
                  note.status === 'urgent_review' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {note.status === 'ai_draft' ? 'AI Draft' : note.status === 'reviewed' ? 'Provider Reviewed' : 'Urgent Review'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Intake Note</h1>
              <p className="text-sm text-[#64748B] mt-1">
                Generated {new Date(note.created_at).toLocaleString()}
                {note.reviewed_at && ` · Reviewed ${new Date(note.reviewed_at).toLocaleString()}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditing(!editing)}
                className="bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-xl px-4 py-2.5 transition-colors shadow-sm"
              >
                {editing ? 'Cancel' : 'Edit Note'}
              </button>
              <button
                onClick={approve}
                disabled={saving}
                className="bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm"
              >
                {saving ? 'Saving...' : note.status === 'reviewed' ? '✓ Re-approve' : '✓ Approve Note'}
              </button>
            </div>
          </div>

          {/* AI disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 font-medium">
            This is an AI-generated draft. Review and edit before using as a clinical record.
          </div>

          {/* Risk Flags */}
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-amber-800">⚠ Risk Flags</h2>
            {note.risk_flags?.length > 0 ? (
              <ul className="space-y-1.5">
                {note.risk_flags.map((flag, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    {flag}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-amber-700 italic">Not enough information was provided during intake to identify specific risk flags.</p>
            )}
          </section>

          {/* Patient Summary */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-[#0F172A]">Patient Summary</h2>
            {note.ai_summary ? (
              <p className="text-sm text-[#64748B] leading-relaxed">{note.ai_summary}</p>
            ) : (
              <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake.</p>
            )}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider mb-1">Chief Concern</p>
              {note.chief_concern ? (
                <p className="text-sm text-[#0F172A]">{note.chief_concern}</p>
              ) : (
                <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake.</p>
              )}
            </div>
          </section>

          {/* Symptoms & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-[#0F172A]">Patient-Reported Symptoms</h2>
              {note.symptoms_reported?.length > 0 ? (
                <ul className="space-y-1.5">
                  {note.symptoms_reported.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#64748B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00B894] shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake.</p>
              )}
            </section>
            <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
              <h2 className="font-semibold text-[#0F172A]">Patient Goals</h2>
              {note.patient_goals?.length > 0 ? (
                <ul className="space-y-1.5">
                  {note.patient_goals.map((g, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#64748B]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00CEB8] shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake.</p>
              )}
            </section>
          </div>

          {/* SOAP Note */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0F172A]">SOAP Note Draft</h2>
              <span className="text-xs text-[#64748B]">AI generated · provider review required</span>
            </div>

            {editing ? (
              <textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                rows={20}
                className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] font-mono focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/20 resize-none transition-colors"
              />
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'S — Subjective', content: note.soap_subjective },
                  { label: 'O — Objective', content: note.soap_objective },
                  { label: 'A — Assessment', content: note.soap_assessment },
                  { label: 'P — Plan', content: note.soap_plan },
                ].map(({ label, content }) => (
                  <div key={label} className="border-l-4 border-[#00B894] pl-4 py-1">
                    <p className="text-xs font-semibold text-[#00897B] uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm text-[#64748B] leading-relaxed">{content || 'Not available.'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Suggested Questions */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-[#0F172A]">Suggested Provider Questions</h2>
            {note.suggested_questions?.length > 0 ? (
              <ol className="space-y-2">
                {note.suggested_questions.map((q, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#64748B]">
                    <span className="text-[#00B894] font-bold shrink-0 tabular-nums">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake to generate suggested questions.</p>
            )}
          </section>

          {/* Follow-up */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
            <h2 className="font-semibold text-[#0F172A]">Follow-Up Actions</h2>
            {note.follow_up_actions?.length > 0 ? (
              <ul className="space-y-1.5">
                {note.follow_up_actions.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[#64748B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[#64748B] italic">Not enough information was provided during intake to generate follow-up actions.</p>
            )}
          </section>

          {/* Transcript */}
          <section className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#0F172A]">Full Transcript</h2>
              <button
                onClick={showTranscript ? () => setShowTranscript(false) : loadTranscript}
                className="text-sm text-[#00B894] hover:text-[#00897B] transition-colors font-medium"
              >
                {showTranscript ? 'Hide' : 'Show transcript'}
              </button>
            </div>
            {showTranscript && transcript && (
              <pre className="text-xs text-[#64748B] whitespace-pre-wrap leading-relaxed font-mono max-h-80 overflow-y-auto bg-[#F8FAFC] rounded-xl p-4">
                {transcript}
              </pre>
            )}
            {showTranscript && !transcript && (
              <p className="text-sm text-[#64748B]">Transcript not available.</p>
            )}
          </section>
        </motion.div>
      </main>
    </div>
  );
}
