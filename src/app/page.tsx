'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
});

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-sans',
});

const serif = { fontFamily: 'var(--font-fraunces)' };

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 24 },
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

function IconAlert() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function TranscriptCard() {
  return (
    <div className="relative">
      <div className="absolute -top-3 -left-4 sm:-left-7 z-10 bg-[#20283B] text-[#F6F1E7] text-[10px] font-semibold uppercase tracking-[0.22em] px-3 py-1.5 rounded-full -rotate-3 shadow-md">
        Live during intake
      </div>
      <div className="bg-[#FFFDF7] border border-[#20283B]/10 rounded-2xl p-6 sm:p-7 shadow-[0_24px_60px_-24px_rgba(32,40,59,0.25)] rotate-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#5B6479] mb-4">
          Spoken → structured, in real time
        </p>
        <p style={serif} className="italic text-[#20283B]/75 text-[15px] sm:text-base leading-relaxed mb-6">
          “…honestly I haven&apos;t been sleeping much, maybe three hours a night, and I keep{' '}
          <span className="not-italic [box-decoration-break:clone] bg-[#00B894]/30 px-1 rounded-[2px]">
            replaying conversations
          </span>{' '}
          in my head before I can drift off…”
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3 text-sm border-t border-[#20283B]/10 pt-2.5">
            <span className="text-[#5B6479]">↳ Symptom</span>
            <span className="font-medium text-[#20283B] text-right">Sleep disruption · ~3 hrs/night</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm border-t border-[#20283B]/10 pt-2.5">
            <span className="text-[#5B6479]">↳ Risk flag</span>
            <span className="font-medium text-amber-700 text-right">Rumination — medium</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm border-t border-[#20283B]/10 pt-2.5">
            <span className="text-[#5B6479]">↳ Suggested question</span>
            <span className="font-medium text-[#20283B] text-right">&ldquo;What does bedtime look like for you?&rdquo;</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div
      className={`${fraunces.variable} ${plexSans.variable} flex flex-col min-h-screen bg-[#F6F1E7] text-[#20283B]`}
      style={{ fontFamily: 'var(--font-plex-sans)' }}
    >
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Dot-grid paper texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(32,40,59,0.07) 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 45% at 85% -10%, rgba(0,184,148,0.16) 0%, transparent 65%)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
          {/* ── Masthead nav ── */}
          <nav className="flex items-center justify-between pt-8 pb-6 border-b border-[#20283B]/12">
            <span style={serif} className="text-xl text-[#20283B] tracking-tight">
              Klarity VoiceNote
            </span>
            <Link
              href="/dashboard"
              className="text-sm text-[#5B6479] hover:text-[#20283B] font-medium transition-colors"
            >
              Provider Dashboard →
            </Link>
          </nav>

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-16 lg:gap-14 items-center py-20 sm:py-28">
            <motion.div variants={stagger} initial="initial" animate="animate">
              <motion.div
                variants={fadeUp}
                className="flex items-center gap-3 mb-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5B6479]"
              >
                <span className="h-px w-9 bg-[#20283B]/30" />
                Field notes for mental health practices
              </motion.div>

              <motion.h1
                variants={fadeUp}
                style={serif}
                className="text-[2.6rem] sm:text-6xl lg:text-[5.25rem] text-[#20283B] leading-[1.05] tracking-tight"
              >
                Stop starting every session{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="relative z-10">from nothing.</span>
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-[0.12em] h-[0.34em] bg-[#00B894]/40 -rotate-1 -z-0"
                  />
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 text-base sm:text-lg text-[#5B6479] max-w-lg leading-relaxed"
              >
                Your patient speaks with an AI before their appointment. By the time
                they arrive, you already have a clinical note — written, risk-flagged,
                and ready to review.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-9"
              >
                <Link
                  href="/intake"
                  className="group inline-flex items-center gap-2 text-[#20283B] font-semibold text-base border-b-2 border-[#00B894] pb-1 transition-all duration-200 hover:gap-3 w-fit"
                >
                  Start a patient intake
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/dashboard"
                  className="text-[#5B6479] hover:text-[#20283B] text-sm font-medium transition-colors w-fit"
                >
                  Or open the provider dashboard
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block"
            >
              <TranscriptCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-[#FFFDF7] px-6 sm:px-8 py-20 sm:py-28 border-t border-[#20283B]/12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 max-w-xl"
          >
            <p style={serif} className="italic text-[#00897B] text-lg mb-2">How it works</p>
            <h2 style={serif} className="text-3xl sm:text-4xl text-[#20283B]">Two flows. One outcome.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Patient */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#F6F1E7] rounded-2xl p-8 border border-[#20283B]/10"
            >
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-7 h-7 rounded-lg bg-[#00B894]/12 flex items-center justify-center text-[#00897B]">
                  <IconUser />
                </div>
                <p className="font-semibold text-[#20283B] text-sm">For patients</p>
              </div>
              <div className="space-y-5">
                {patientSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span style={serif} className="italic text-[#00897B] text-lg w-6 shrink-0 text-right tabular-nums">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[#20283B] text-sm">{s.title}</p>
                      <p className="text-[#5B6479] text-sm mt-0.5 leading-relaxed">{s.text}</p>
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
              className="bg-[#20283B] rounded-2xl p-8 border border-white/5"
            >
              <div className="flex items-center gap-2.5 mb-7">
                <div className="w-7 h-7 rounded-lg bg-[#00B894]/20 flex items-center justify-center text-[#00CEB8]">
                  <IconStethoscope />
                </div>
                <p className="font-semibold text-white text-sm">For providers</p>
              </div>
              <div className="space-y-5">
                {providerSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <span style={serif} className="italic text-[#00CEB8] text-lg w-6 shrink-0 text-right tabular-nums">
                      {i + 1}
                    </span>
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

      {/* ── What you get — table of contents ── */}
      <section className="bg-[#F6F1E7] px-6 sm:px-8 py-20 sm:py-28 border-t border-[#20283B]/12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 max-w-xl"
          >
            <p style={serif} className="italic text-[#00897B] text-lg mb-2">Documentation</p>
            <h2 style={serif} className="text-3xl sm:text-4xl text-[#20283B]">Everything in the note, indexed.</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid sm:grid-cols-2 gap-x-14"
          >
            {noteFields.map((label, i) => (
              <div
                key={label}
                className="flex items-baseline gap-4 py-4 border-b border-[#20283B]/12"
              >
                <span style={serif} className="italic text-[#00B894] text-lg w-8 shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[#20283B] font-medium">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Safety ── */}
      <section className="bg-[#FFFDF7] px-6 sm:px-8 py-14 border-t border-[#20283B]/12">
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
      <footer className="bg-[#F6F1E7] border-t border-[#20283B]/12 px-6 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span style={serif} className="italic text-[#00897B] tracking-tight text-sm">Klarity VoiceNote</span>
          <p className="text-[#5B6479] text-xs">AI-powered intake for mental health providers</p>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/intake" className="text-[#5B6479] hover:text-[#20283B] transition-colors text-xs">Patient Intake</Link>
            <Link href="/dashboard" className="text-[#5B6479] hover:text-[#20283B] transition-colors text-xs">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
