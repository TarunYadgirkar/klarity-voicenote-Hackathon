'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

const features = [
  {
    emoji: '🎙️',
    title: 'Patients talk before they arrive',
    desc: 'An AI voice agent walks your patient through intake at home, on their own time. No clipboards, no awkward first-five-minutes.',
  },
  {
    emoji: '📋',
    title: 'You get a note, not a transcript',
    desc: 'What they said gets turned into a structured SOAP draft — chief concern, symptoms, goals — ready to review before the session.',
  },
  {
    emoji: '🚩',
    title: 'High-risk patients surface first',
    desc: 'The AI flags anything that needs attention so you\'re not scanning through notes trying to figure out who needs you most.',
  },
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
              Built for therapists and mental health practices
            </div>

            <h1 className="text-5xl font-bold text-[#0F172A] leading-tight">
              Your patients talk.<br />
              <span className="text-[#00B894]">You walk in ready.</span>
            </h1>

            <p className="text-xl text-[#64748B] max-w-lg mx-auto leading-relaxed">
              Klarity replaces your intake forms with a short AI voice conversation — before the appointment. You get a full clinical picture waiting for you, not a blank page.
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

        {/* Feature cards */}
        <section className="bg-[#F8FAFC] px-6 py-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ scale: 1.005 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0] transition-shadow hover:shadow-md"
              >
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="font-semibold text-[#0F172A] text-lg mb-2">{f.title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Safety notice */}
        <section className="bg-white px-6 py-10">
          <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-2">Safety Notice</p>
            <p className="text-amber-800 text-sm leading-relaxed">
              Klarity is an intake tool, not a therapist. It collects information for your licensed provider and doesn't offer diagnosis, treatment, or crisis support. If you or someone you know is in danger, call{' '}
              <strong>911</strong> or text <strong>988</strong> to reach the Suicide & Crisis Lifeline.
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
