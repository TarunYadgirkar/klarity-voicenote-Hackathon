'use client';

import { useState } from 'react';
import Link from 'next/link';

type Step = 'form' | 'consent' | 'calling' | 'complete';

export default function IntakePage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [appointmentType, setAppointmentType] = useState('Initial consultation');
  const [ageRange, setAgeRange] = useState('');
  const [consented, setConsented] = useState(false);
  const [callData, setCallData] = useState<{ callId: string; patientId: string; demoMode?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function startCall() {
    setLoading(true);
    try {
      const res = await fetch('/api/create-web-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: name, appointmentType, ageRange }),
      });
      const data = await res.json();
      setCallData(data);
      setStep('calling');
    } catch {
      alert('Failed to start call. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function useDemoTranscript() {
    if (!callData) return;
    setDemoLoading(true);
    try {
      await fetch('/api/demo-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: callData.callId, patientId: callData.patientId }),
      });
      setStep('complete');
    } catch {
      alert('Demo failed. Try again.');
    } finally {
      setDemoLoading(false);
    }
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
        <span className="text-sm text-slate-500">Patient Intake</span>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6">
          {step === 'form' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-white">Before your appointment</h1>
                <p className="mt-2 text-slate-400">
                  Complete a short voice intake so your provider can prepare.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-300">
                <strong>Not a therapist.</strong> This AI collects information only. It cannot diagnose, treat, or provide emergency support. If you are in crisis, call 911 or text 988.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name only is fine"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Appointment type</label>
                  <select
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Initial consultation</option>
                    <option>Initial psychiatry intake</option>
                    <option>Follow-up therapy</option>
                    <option>Medication management</option>
                    <option>Follow-up psychiatry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Age range (optional)</label>
                  <select
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Prefer not to say</option>
                    <option>18-24</option>
                    <option>25-34</option>
                    <option>35-44</option>
                    <option>45-54</option>
                    <option>55+</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setStep('consent')}
                disabled={!name.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {step === 'consent' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-white">Before we begin</h1>
                <p className="mt-2 text-slate-400">Please read and accept before starting the intake.</p>
              </div>

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3 text-sm text-slate-300 leading-relaxed">
                <p><strong className="text-white">What this is:</strong> An AI voice assistant that collects intake information for your licensed provider at Klarity Health.</p>
                <p><strong className="text-white">What this is not:</strong> This is not therapy, diagnosis, treatment, or crisis support. This AI cannot make medical decisions.</p>
                <p><strong className="text-white">Your responses:</strong> Your conversation will be transcribed and summarized. Your provider will review the summary before your appointment.</p>
                <p><strong className="text-white">Emergency:</strong> If you are in immediate danger or thinking about harming yourself or others, call 911 or text 988 now.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm text-slate-300">
                  I understand this is an AI intake assistant, not a therapist. I consent to my responses being summarized for my provider&apos;s review.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors border border-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={startCall}
                  disabled={!consented || loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                >
                  {loading ? 'Starting...' : 'Start Voice Intake'}
                </button>
              </div>
            </>
          )}

          {step === 'calling' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {callData?.demoMode ? 'Demo Mode' : 'Voice Intake Active'}
                </h1>
                <p className="mt-2 text-slate-400">
                  {callData?.demoMode
                    ? 'Retell not configured. Use demo transcript to generate a sample note.'
                    : 'Speak naturally with the AI intake assistant.'}
                </p>
              </div>

              {callData?.demoMode ? (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                    <p className="text-sm font-medium text-slate-300">Demo transcript preview:</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                      Patient reports increased anxiety for the past month, chest tightness at night, sleep disruption of 4-5 hours, academic stress from finals and grad school applications...
                    </p>
                  </div>
                  <button
                    onClick={useDemoTranscript}
                    disabled={demoLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                  >
                    {demoLoading ? 'Generating note...' : 'Use Demo Transcript + Generate Note'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
                      <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-slate-300">Retell call initiated. Speak when ready.</p>
                    <p className="text-xs text-slate-500">Call ID: {callData?.callId}</p>
                  </div>
                  <button
                    onClick={() => setStep('complete')}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                  >
                    Call Complete — View Summary
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Intake Complete</h1>
                <p className="mt-3 text-slate-400 leading-relaxed">
                  Your intake has been saved. Your provider will review your summary before the appointment.
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
                You do not need to do anything else. If this was urgent, please contact your provider directly.
              </div>
              <Link href="/" className="inline-block text-blue-400 hover:text-blue-300 transition-colors">
                ← Back to home
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
