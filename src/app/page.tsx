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
    icon: '📱',
    title: 'Get the link',
    text: 'Your provider sends a link before your appointment.',
  },
  {
    icon: '🎙',
    title: 'Have a conversation',
    text: 'Speak naturally with an AI from home. Takes about 5 minutes.',
  },
  {
    icon: '✓',
    title: 'You\'re done',
    text: 'Show up to your session. Nothing else required.',
  },
];

const providerSteps = [
  {
    icon: '📋',
    title: 'Open the dashboard',
    text: 'Before the session, open your intake queue.',
  },
  {
    icon: '🔍',
    title: 'Review the note',
    text: 'AI-generated SOAP note, risk level, chief concern, and suggested questions — ready.',
  },
  {
    icon: '✦',
    title: 'Walk in prepared',
    text: 'Start every session with full context. No blank page.',
  },
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

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Nav ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-6 py-5 flex items-center justify-between">
        <span className="font-bold text-xl text-white tracking-tight drop-shadow">Klarity VoiceNote</span>
        <Link
          href="/dashboard"
          className="text-sm text-white/70 hover:text-white transition-colors font-medium"
        >
          Provider Dashboard →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0a1628]">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="hero-orb absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #00B894 0%, transparent 70%)' }}
          />
          <div
            className="hero-orb absolute -bottom-1/3 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
              animationDelay: '-5s',
              animationDirection: 'reverse',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 20% 50%, rgba(0,184,148,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(14,165,233,0.06) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-[#00CEB8] text-sm font-medium">
                AI voice intake for mental health practices
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
            >
              Stop starting every<br />
              session{' '}
              <span
                className="text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #00B894, #00CEB8)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                from nothing.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
            >
              Your patient speaks with an AI before their appointment.
              By the time they arrive, you already have a clinical note —
              written, risk-flagged, and ready to review.
            </motion.p>

            {/* Voice wave visual */}
            <motion.div
              variants={fadeUp}
              className="flex justify-center py-2"
            >
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-10 py-6">
                <VoiceWave active={true} />
                <p className="text-white/30 text-xs mt-4 text-center tracking-widest uppercase">
                  AI listening · 3:42
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 text-white font-semibold rounded-2xl px-8 py-4 text-lg transition-all duration-200 shadow-lg hover:shadow-[#00B894]/40 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #00B894, #00CEB8)' }}
              >
                Patient Intake <span>→</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-2xl px-8 py-4 text-lg transition-all duration-200 backdrop-blur-sm"
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
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-[#00B894] uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A]">Two flows. One outcome.</h2>
            <p className="text-[#64748B] mt-3 max-w-lg mx-auto">
              Patients get a calmer, more natural intake experience. Providers get clinical documentation before the session starts.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-[#E2E8F0]"
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl bg-[#00B894]/10 flex items-center justify-center text-lg">🙍</div>
                <p className="font-bold text-[#0F172A]">For patients</p>
              </div>
              <div className="space-y-5">
                {patientSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#00B894]/10 text-[#00B894] font-bold text-sm flex items-center justify-center shrink-0">
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
              className="bg-[#0a1628] rounded-3xl p-8 shadow-sm border border-white/5"
            >
              <div className="flex items-center gap-3 mb-7">
                <div className="w-9 h-9 rounded-xl bg-[#00B894]/20 flex items-center justify-center text-lg">🩺</div>
                <p className="font-bold text-white">For providers</p>
              </div>
              <div className="space-y-5">
                {providerSteps.map((s, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-[#00B894]/20 text-[#00CEB8] font-bold text-sm flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{s.title}</p>
                      <p className="text-white/50 text-sm mt-0.5 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini note preview */}
              <div className="mt-7 bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">AI Draft · Ready for review</p>
                  <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">Medium risk</span>
                </div>
                {['Chief concern: Elevated anxiety, sleep disruption', 'Symptoms: Chest tightness, rumination', 'Goal: Develop coping strategies'].map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/40">
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
            className="text-center mb-14"
          >
            <p className="text-sm font-semibold text-[#00B894] uppercase tracking-widest mb-3">Documentation</p>
            <h2 className="text-3xl font-bold text-[#0F172A]">Everything in the note</h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: 'SOAP Note', icon: '📄' },
              { label: 'Chief Concern', icon: '🎯' },
              { label: 'Risk Level', icon: '⚠️' },
              { label: 'Risk Flags', icon: '🚩' },
              { label: 'Symptoms', icon: '📊' },
              { label: 'Patient Goals', icon: '🌱' },
              { label: 'Suggested Questions', icon: '💬' },
              { label: 'Full Transcript', icon: '🔤' },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-[#00B894]/40 hover:bg-[#00B894]/5 transition-colors group"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-medium text-[#0F172A] group-hover:text-[#00B894] transition-colors">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety ── */}
      <section className="bg-[#F8FAFC] px-6 py-14 border-t border-[#E2E8F0]">
        <div className="max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-600 text-lg">⚠</div>
            <div>
              <p className="text-sm font-bold text-amber-800 mb-1">Safety Notice</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Klarity VoiceNote is an intake tool, not a therapist. It collects information for your licensed provider and doesn&apos;t offer diagnosis, treatment, or crisis support. If you or someone you know is in danger, call{' '}
                <strong>911</strong> or text <strong>988</strong> to reach the Suicide &amp; Crisis Lifeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#E2E8F0] px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-bold text-[#00B894] tracking-tight">Klarity VoiceNote</span>
          <p className="text-[#64748B] text-sm">AI-powered intake for mental health providers</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/intake" className="text-[#64748B] hover:text-[#00B894] transition-colors">Patient Intake</Link>
            <Link href="/dashboard" className="text-[#64748B] hover:text-[#00B894] transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
