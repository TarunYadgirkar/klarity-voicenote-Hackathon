'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

const patientSteps = [
  {
    title: 'Get the link',
    text: 'Your provider sends a link before your appointment.',
  },
  {
    title: 'Have a conversation',
    text: 'Speak naturally with an AI from home. Takes about 5 minutes.',
  },
  {
    title: "You're done",
    text: 'Show up to your session. Nothing else required.',
  },
];

const providerSteps = [
  {
    title: 'Open the dashboard',
    text: 'Before the session, open your intake queue.',
  },
  {
    title: 'Review the note',
    text: 'SOAP note, risk level, chief concern, and suggested questions — ready.',
  },
  {
    title: 'Walk in prepared',
    text: 'Start every session with full context. No blank page.',
  },
];

const noteFields = [
  'SOAP Note',
  'Chief Concern',
  'Risk Level',
  'Risk Flags',
  'Symptoms Reported',
  'Patient Goals',
  'Suggested Questions',
  'Full Transcript',
];

function VoiceWave({ active = true }: { active?: boolean }) {
  const barClass = active ? 'voice-bar-active' : 'voice-bar';
  const heights = ['h-4', 'h-8', 'h-12', 'h-16', 'h-12', 'h-8', 'h-4'];
  return (
    <div className="flex items-end gap-[5px] h-16">
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-[5px] rounded-full bg-[#00B894] ${h} ${barClass}`}
        />
      ))}
    </div>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconStethoscope() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Nav ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-8 py-5 flex items-center justify-between">
        <span className="font-bold text-lg text-white tracking-tight">Klarity VoiceNote</span>
        <Link
          href="/dashboard"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Provider Dashboard →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#070f1e]">
        {/* Subtle noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 200px',
          }}
        />

        {/* Tight radial glow — no drifting blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,184,148,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
            >
              Stop starting every<br />
              session{' '}
              <span className="text-[#00B894]">
                from nothing.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed"
            >
              Your patient speaks with an AI before their appointment.
              By the time they arrive, you already have a clinical note —
              written, risk-flagged, and ready to review.
            </motion.p>

            {/* Voice wave visual */}
            <motion.div variants={fadeUp} className="flex justify-center py-2">
              <div className="flex flex-col items-center gap-4">
                <VoiceWave active={true} />
                <p className="text-white/25 text-xs tracking-widest uppercase">
                  AI listening · 3:42
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 bg-[#00B894] hover:bg-[#00a07f] text-white font-semibold rounded-xl px-8 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 min-w-[200px]"
              >
                Patient Intake →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 border border-white/15 text-white font-medium rounded-xl px-8 py-3 text-sm transition-all duration-200 min-w-[200px]"
              >
                Provider Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #F8FAFC)' }}
        />
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#F8FAFC] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <p className="text-xs font-semibold text-[#00B894] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">Two flows. One outcome.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patient */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-7 h-7 rounded-lg bg-[#00B894]/10 flex items-center justify-center text-[#00B894]">
                  <IconUser />
                </div>
                <p className="font-semibold text-[#0F172A] text-sm">For patients</p>
              </div>
              <div className="space-y-5">
                {patientSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[#00B894]/10 text-[#00B894] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-[#0F172A] text-sm">{s.title}</p>
                      <p className="text-[#64748B] text-sm mt-0.5 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Provider */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#070f1e] rounded-2xl p-8 shadow-sm border border-white/5"
            >
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-7 h-7 rounded-lg bg-[#00B894]/20 flex items-center justify-center text-[#00B894]">
                  <IconStethoscope />
                </div>
                <p className="font-semibold text-white text-sm">For providers</p>
              </div>
              <div className="space-y-5">
                {providerSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-[#00B894]/20 text-[#00CEB8] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{s.title}</p>
                      <p className="text-white/45 text-sm mt-0.5 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini note preview */}
              <div className="mt-7 bg-white/5 border border-white/8 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-white/35 font-medium uppercase tracking-wider">AI Draft · Ready for review</p>
                  <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-medium">Medium risk</span>
                </div>
                {['Chief concern: Elevated anxiety, sleep disruption', 'Symptoms: Chest tightness, rumination', 'Goal: Develop coping strategies'].map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/35">
                    <span className="w-1 h-1 rounded-full bg-[#00B894] mt-1.5 shrink-0" />
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="bg-white px-6 py-20 border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <p className="text-xs font-semibold text-[#00B894] uppercase tracking-widest mb-3">Documentation</p>
            <h2 className="text-3xl font-bold text-[#0F172A]">Everything in the note</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-0 border border-[#E2E8F0] rounded-2xl overflow-hidden"
          >
            {noteFields.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 px-5 py-4 bg-white hover:bg-[#F8FAFC] transition-colors ${
                  i < noteFields.length - 4 ? 'border-b border-[#E2E8F0]' : ''
                } ${i % 4 !== 3 ? 'sm:border-r border-[#E2E8F0]' : ''} ${
                  i % 2 !== 1 ? 'border-r border-[#E2E8F0] sm:border-r-0' : ''
                } ${i % 2 !== 1 && i % 4 !== 3 ? 'sm:border-r border-[#E2E8F0]' : ''}`}
              >
                <span className="text-[#00B894] shrink-0">
                  <IconCheck />
                </span>
                <p className="text-sm font-medium text-[#0F172A]">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Safety ── */}
      <section className="bg-[#F8FAFC] px-6 py-14 border-t border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-3.5">
            <div className="text-amber-500 shrink-0 mt-0.5">
              <IconAlert />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Safety Notice</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Klarity VoiceNote is an intake tool, not a therapist. It collects information for your licensed provider and doesn&apos;t offer diagnosis, treatment, or crisis support. If you or someone you know is in danger, call{' '}
                <strong>911</strong> or text <strong>988</strong> to reach the Suicide &amp; Crisis Lifeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#E2E8F0] px-8 py-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-[#00B894] tracking-tight text-sm">Klarity VoiceNote</span>
          <p className="text-[#94A3B8] text-xs">AI-powered intake for mental health providers</p>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/intake" className="text-[#64748B] hover:text-[#0F172A] transition-colors text-xs">Patient Intake</Link>
            <Link href="/dashboard" className="text-[#64748B] hover:text-[#0F172A] transition-colors text-xs">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
