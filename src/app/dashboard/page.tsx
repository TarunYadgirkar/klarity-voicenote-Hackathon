'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PatientRow {
  id: string;
  name: string;
  appointment_type: string;
  call_status: string;
  note_id?: string;
  note_status?: string;
  risk_level?: string;
  created_at: string;
}

const RISK_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
  none: 'bg-slate-700 text-slate-400 border-slate-600',
};

const STATUS_COLORS: Record<string, string> = {
  urgent_review: 'bg-red-500/20 text-red-400',
  ai_draft: 'bg-blue-500/20 text-blue-400',
  reviewed: 'bg-green-500/20 text-green-400',
};

const STATUS_LABELS: Record<string, string> = {
  urgent_review: 'Urgent Review',
  ai_draft: 'AI Draft',
  reviewed: 'Reviewed',
};

export default function DashboardPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchPatients() {
    const res = await fetch('/api/patients');
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 5000);
    return () => clearInterval(interval);
  }, []);

  const urgent = patients.filter((p) => p.risk_level === 'high' || p.note_status === 'urgent_review');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-white">Klarity VoiceNote</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">Provider Dashboard</span>
          <span className="text-sm text-slate-400">Dr. Chen</span>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Patient Intake Queue</h1>
            <p className="text-slate-500 text-sm mt-1">AI-generated summaries require provider review before use.</p>
          </div>
          <Link
            href="/intake"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            + New Intake
          </Link>
        </div>

        {urgent.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-medium text-sm">
              {urgent.length} patient{urgent.length > 1 ? 's' : ''} flagged for urgent provider review
            </span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
            <span>Patient</span>
            <span>Appointment</span>
            <span>Intake</span>
            <span>Risk</span>
            <span>Action</span>
          </div>

          {loading && (
            <div className="px-6 py-12 text-center text-slate-500">Loading patients...</div>
          )}

          {!loading && patients.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-500">
              No patients yet.{' '}
              <Link href="/intake" className="text-blue-400 hover:text-blue-300">
                Start an intake →
              </Link>
            </div>
          )}

          {patients.map((patient, i) => (
            <div
              key={patient.id}
              className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center ${
                i < patients.length - 1 ? 'border-b border-slate-800' : ''
              } hover:bg-slate-800/30 transition-colors`}
            >
              <div>
                <p className="font-medium text-white">{patient.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(patient.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-sm text-slate-300">{patient.appointment_type}</div>
              <div>
                {patient.note_status ? (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[patient.note_status] || 'bg-slate-700 text-slate-400'}`}>
                    {STATUS_LABELS[patient.note_status] || patient.note_status}
                  </span>
                ) : patient.call_status === 'completed' ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700 text-slate-400">
                    Processing...
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-700 text-slate-400">
                    Pending
                  </span>
                )}
              </div>
              <div>
                {patient.risk_level ? (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${RISK_COLORS[patient.risk_level] || RISK_COLORS.none}`}>
                    {patient.risk_level}
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>
              <div>
                {patient.note_id ? (
                  <Link
                    href={`/dashboard/${patient.note_id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    View Note →
                  </Link>
                ) : (
                  <span className="text-sm text-slate-600">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
