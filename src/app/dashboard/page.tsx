'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  high: 'bg-red-50 text-red-600 border-red-200',
  medium: 'bg-amber-50 text-amber-600 border-amber-200',
  low: 'bg-green-50 text-green-600 border-green-200',
  none: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  urgent_review: 'bg-red-50 text-red-600',
  ai_draft: 'bg-blue-50 text-blue-600',
  reviewed: 'bg-green-50 text-green-600',
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
    const timeout = setTimeout(() => { void fetchPatients(); }, 0);
    const interval = setInterval(fetchPatients, 5000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, []);

  const urgent = patients.filter((p) => p.risk_level === 'high' || p.note_status === 'urgent_review');
  const pending = patients.filter((p) => !p.note_status || p.note_status === 'ai_draft' || p.note_status === 'urgent_review');
  const highRisk = patients.filter((p) => p.risk_level === 'high');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-[#00B894] tracking-tight">Klarity VoiceNote</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#64748B]">Provider Dashboard</span>
          <span className="text-sm font-medium text-[#0F172A]">Dr. Chen</span>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">Patient Intake Queue</h1>
              <p className="text-[#64748B] text-sm mt-1">AI-generated summaries require provider review before use.</p>
            </div>
            <Link
              href="/intake"
              className="bg-[#00B894] hover:bg-[#00897B] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors shadow-sm"
            >
              + New Intake
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Patients', value: patients.length, color: 'text-[#0F172A]' },
              { label: 'Pending Review', value: pending.length, color: 'text-amber-600' },
              { label: 'High Risk', value: highRisk.length, color: 'text-red-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                <p className="text-[#64748B] text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Urgent banner */}
          {urgent.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shrink-0" />
              <span className="text-red-700 font-medium text-sm">
                {urgent.length} patient{urgent.length > 1 ? 's' : ''} flagged for urgent provider review
              </span>
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B] uppercase tracking-wider">
              <span>Patient</span>
              <span>Appointment</span>
              <span>Intake</span>
              <span>Risk</span>
              <span>Action</span>
            </div>

            {loading && (
              <div className="px-6 py-12 text-center text-[#64748B]">Loading patients...</div>
            )}

            {!loading && patients.length === 0 && (
              <div className="px-6 py-12 text-center text-[#64748B]">
                No patients yet.{' '}
                <Link href="/intake" className="text-[#00B894] hover:text-[#00897B] font-medium">
                  Start an intake →
                </Link>
              </div>
            )}

            {patients.map((patient, i) => (
              <div
                key={patient.id}
                className={`grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors ${
                  i < patients.length - 1 ? 'border-b border-[#E2E8F0]' : ''
                }`}
              >
                <div>
                  <p className="font-semibold text-[#0F172A]">{patient.name}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{new Date(patient.created_at).toLocaleDateString()}</p>
                </div>

                <div className="text-sm text-[#64748B]">{patient.appointment_type}</div>

                <div>
                  {patient.note_status ? (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[patient.note_status] || 'bg-slate-100 text-slate-500'}`}>
                      {STATUS_LABELS[patient.note_status] || patient.note_status}
                    </span>
                  ) : patient.call_status === 'completed' ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Processing...</span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">Pending</span>
                  )}
                </div>

                <div>
                  {patient.note_id ? (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${RISK_COLORS[patient.risk_level || 'none'] || RISK_COLORS.none}`}>
                      {patient.risk_level || 'none'}
                    </span>
                  ) : (
                    <span className="text-xs text-[#64748B]">—</span>
                  )}
                </div>

                <div>
                  {patient.note_id ? (
                    <Link
                      href={`/dashboard/${patient.note_id}`}
                      className="text-sm text-[#00B894] hover:text-[#00897B] font-semibold transition-colors"
                    >
                      View Note →
                    </Link>
                  ) : (
                    <span className="text-sm text-[#64748B]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
