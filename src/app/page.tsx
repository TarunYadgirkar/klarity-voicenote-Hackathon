'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const patientSteps = [
  { step: '1', text: 'Gets a link before their appointment' },
  { step: '2', text: 'Has a short voice conversation with an AI — from home, on their phone' },
  { step: '3', text: 'Shows up to the session. Nothing else required.' },
];

const providerSteps = [
  { step: '1', text: 'Opens the dashboard before the session' },
  { step: '2', text: 'Sees a SOAP note, chief concern, symptoms, risk level, and suggested questions — already written' },
  { step: '3', text: 'Reviews, edits if needed, and walks into the room prepared' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl text-[#00B894] tracking-tight">Klarity VoiceNote</span>
        <Link
          href="/dashboard"
          className="text-sm text-[#64748B] hover:text-[#00B894] transition-colors font-medium"
        >
          Provider Dashboard →
        </Link>
      </nav>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white px-6 py-24 flex flex-col items-center text-center">
          <motion.div {...fadeUp} className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#00B894]/10 border border-[#00B894]/20 rounded-full px-4 py-1.5 text-[#00B894] text-sm font-medium">
              AI voice intake for mental health practices
            </div>

            <h1 className="text-5xl font-bold text-[#0F172A] leading-tight">
              Stop starting every session<br />
              <span className="text-[#00B894]">from a blank page.</span>
            </h1>

            <p className="text-xl text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Klarity is an AI intake tool for therapists. Your patient talks to an AI before their appointment. By the time they arrive, you already have a clinical note — written, risk-flagged, and ready to review.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center gap-2 bg-[#00B894] hover:bg-[#00897B] text-white font-semibold rounded-xl px-8 py-4 transition-colors text-lg shadow-sm"
              >
                Patient Intake <span>→</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold rounded-xl px-8 py-4 transition-colors text-lg border border-[#E2E8F0] shadow-sm"
              >
                Provider Dashboard
              </Link>
            </div>
          </motion.div>
        </section>

        {/* How it works */}
        <section className="bg-[#F8FAFC] px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold text-[#0F172A] text-center mb-10"
            >
              How it works
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Patient side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">For patients</p>
                <div className="space-y-4">
                  {patientSteps.map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00B894]/10 text-[#00B894] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <p className="text-[#0F172A] text-sm leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Provider side */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0]"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-4">For providers</p>
                <div className="space-y-4">
                  {providerSteps.map((s) => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00B894]/10 text-[#00B894] text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <p className="text-[#0F172A] text-sm leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Safety notice */}
        <section className="bg-white px-6 py-10">
          <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">Safety Notice</p>
            <p className="text-amber-800 text-sm leading-relaxed">
              Klarity is an intake tool, not a therapist. It collects information for your licensed provider and doesn&apos;t offer diagnosis, treatment, or crisis support. If you or someone you know is in danger, call{' '}
              <strong>911</strong> or text <strong>988</strong> to reach the Suicide &amp; Crisis Lifeline.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-4 text-center text-[#64748B] text-sm">
        Klarity VoiceNote · AI-powered intake for mental health providers
      </footer>
    </div>
  );
}
