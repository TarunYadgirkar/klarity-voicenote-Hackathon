'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

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
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  none: 'bg-slate-700 text-slate-400 border-slate-600',
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
    if (res.ok) {
      const data = await res.json();
      setNote(data);
    }
    setRiskSaving(false);
  }

  async function approve() {
    setSaving(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'reviewed', providerEditedNote: editedNote }),
    });
    if (res.ok) {
      const data = await res.json();
      setNote(data);
    }
    setSaving(false);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Loading note...
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">
        Note not found.{' '}
        <Link href="/dashboard" className="text-blue-400 ml-2">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-white">Klarity VoiceNote</span>
        </Link>
        <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                {(['none', 'low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateRisk(level)}
                    disabled={riskSaving}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize transition-opacity ${
                      note.risk_level === level
                        ? RISK_COLORS[level] || RISK_COLORS.none
                        : 'bg-slate-800 text-slate-500 border-slate-700 opacity-50 hover:opacity-80'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                note.status === 'reviewed' ? 'bg-green-500/20 text-green-400' :
                note.status === 'urgent_review' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {note.status === 'ai_draft' ? 'AI Draft' : note.status === 'reviewed' ? 'Provider Reviewed' : 'Urgent Review'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Intake Note</h1>
            <p className="text-sm text-slate-500 mt-1">
              Generated {new Date(note.created_at).toLocaleString()}
              {note.reviewed_at && ` · Reviewed ${new Date(note.reviewed_at).toLocaleString()}`}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium rounded-xl px-4 py-2.5 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit Note'}
            </button>
            <button
              onClick={approve}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors"
            >
              {saving ? 'Saving...' : note.status === 'reviewed' ? '✓ Re-approve' : '✓ Approve Note'}
            </button>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300">
          AI Draft — This note was generated by AI and requires provider review. Do not use as clinical record without verification.
        </div>

        {/* Risk Flags */}
        {note.risk_flags?.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Risk Flags</h2>
            <ul className="space-y-1.5">
              {note.risk_flags.map((flag, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                  {flag}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Patient Summary */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-white">Patient Summary</h2>
          <p className="text-sm text-slate-300 leading-relaxed">{note.ai_summary}</p>
          {note.chief_concern && (
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Chief Concern</p>
              <p className="text-sm text-slate-300">{note.chief_concern}</p>
            </div>
          )}
        </section>

        {/* Symptoms & Goals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {note.symptoms_reported?.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-white">Patient-Reported Symptoms</h2>
              <ul className="space-y-1.5">
                {note.symptoms_reported.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {note.patient_goals?.length > 0 && (
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold text-white">Patient Goals</h2>
              <ul className="space-y-1.5">
                {note.patient_goals.map((g, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                    {g}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* SOAP Note */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">SOAP Note Draft</h2>
            <span className="text-xs text-slate-500">AI generated · provider review required</span>
          </div>

          {editing ? (
            <textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              rows={20}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-none"
            />
          ) : (
            <div className="space-y-4">
              {[
                { label: 'S — Subjective', content: note.soap_subjective },
                { label: 'O — Objective', content: note.soap_objective },
                { label: 'A — Assessment', content: note.soap_assessment },
                { label: 'P — Plan', content: note.soap_plan },
              ].map(({ label, content }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{content || 'Not available.'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Questions */}
        {note.suggested_questions?.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Suggested Provider Questions</h2>
            <ol className="space-y-2">
              {note.suggested_questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="text-slate-600 font-mono shrink-0">{i + 1}.</span>
                  {q}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Follow-up */}
        {note.follow_up_actions?.length > 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-white">Follow-Up Actions</h2>
            <ul className="space-y-1.5">
              {note.follow_up_actions.map((a, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Transcript */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Full Transcript</h2>
            <button
              onClick={showTranscript ? () => setShowTranscript(false) : loadTranscript}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showTranscript ? 'Hide' : 'Show transcript'}
            </button>
          </div>
          {showTranscript && transcript && (
            <pre className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed font-mono max-h-80 overflow-y-auto">
              {transcript}
            </pre>
          )}
          {showTranscript && !transcript && (
            <p className="text-sm text-slate-500">Transcript not available.</p>
          )}
        </section>
      </main>
    </div>
  );
}
