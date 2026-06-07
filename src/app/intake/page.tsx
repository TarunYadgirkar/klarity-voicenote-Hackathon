'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

type RetellWebClientType = import('retell-client-js-sdk').RetellWebClient;
type Step = 'form' | 'consent' | 'calling' | 'complete';

interface TranscriptUtterance {
  role: 'agent' | 'user';
  content: string;
}

const STEPS = ['Form', 'Consent', 'Call', 'Done'];
const STEP_INDEX: Record<Step, number> = { form: 0, consent: 1, calling: 2, complete: 3 };

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.38, ease: 'easeOut' as const },
};

// ── Voice visualizer ──────────────────────────────────────────────
function VoiceVisualizer({ state }: { state: 'idle' | 'connecting' | 'active' | 'agent' | 'ended' }) {
  const barHeights = ['h-5', 'h-9', 'h-14', 'h-20', 'h-14', 'h-9', 'h-5'];

  if (state === 'ended') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-[#00B894]/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-[#00B894]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[#64748B] text-sm">Processing your intake…</p>
      </div>
    );
  }

  if (state === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="animate-breathe w-16 h-16 bg-[#00B894]/15 rounded-full flex items-center justify-center">
          <div className="w-8 h-8 bg-[#00B894]/30 rounded-full" />
        </div>
        <p className="text-[#64748B] text-sm">Connecting — allow microphone access…</p>
      </div>
    );
  }

  const isActive = state === 'active' || state === 'agent';
  const barClass = isActive ? 'voice-bar-active' : 'voice-bar';
  const barColor = state === 'agent' ? 'bg-[#00CEB8]' : 'bg-[#00B894]';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-end gap-[6px] h-20 px-2">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-[6px] rounded-full ${barColor} ${h} ${barClass} transition-colors duration-500`}
          />
        ))}
      </div>
      <p className="text-[#64748B] text-sm">
        {state === 'agent' ? 'Agent is speaking…' : 'Listening — speak when ready'}
      </p>
    </div>
  );
}

export default function IntakePage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [appointmentType, setAppointmentType] = useState('Initial consultation');
  const [ageRange, setAgeRange] = useState('');
  const [consented, setConsented] = useState(false);
  const [callData, setCallData] = useState<{
    callId: string;
    patientId: string;
    demoMode?: boolean;
    accessToken?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [retellError, setRetellError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptUtterance[]>([]);
  const [agentTalking, setAgentTalking] = useState(false);

  const retellClientRef = useRef<RetellWebClientType | null>(null);
  const callDataRef = useRef<{ callId: string; retellCallId?: string } | null>(null);

  const startRetellCall = useCallback(async (accessToken: string) => {
    try {
      const { RetellWebClient } = await import('retell-client-js-sdk');
      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on('call_started', () => { setCallStarted(true); setCallActive(true); setRetellError(null); });

      client.on('call_ended', () => {
        setCallActive(false);
        setCallEnded(true);
        const cd = callDataRef.current;
        if (cd?.retellCallId) {
          fetch('/api/fetch-retell-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ retellCallId: cd.retellCallId, callId: cd.callId }),
          }).catch(console.error);
        }
        setTimeout(() => setStep('complete'), 1500);
      });

      client.on('agent_start_talking', () => setAgentTalking(true));
      client.on('agent_stop_talking', () => setAgentTalking(false));

      client.on('update', (update) => {
        if (update && Array.isArray(update.transcript)) {
          setLiveTranscript(update.transcript.map((u: { role: string; content: string }) => ({
            role: u.role as 'agent' | 'user',
            content: u.content,
          })));
        }
      });

      client.on('error', (error) => {
        console.error('Retell error:', error);
        setRetellError(typeof error === 'string' ? error : 'An error occurred during the call.');
        client.stopCall();
        setCallActive(false);
      });

      await client.startCall({ accessToken });
    } catch (err) {
      console.error('Failed to start Retell call:', err);
      setRetellError('Could not start voice call. Check microphone permissions and try again.');
    }
  }, []);

  const stopRetellCall = useCallback(() => {
    retellClientRef.current?.stopCall();
    setCallActive(false);
    setCallEnded(true);
    const cd = callDataRef.current;
    if (cd?.retellCallId) {
      fetch('/api/fetch-retell-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retellCallId: cd.retellCallId, callId: cd.callId }),
      }).catch(console.error);
    }
    setTimeout(() => setStep('complete'), 800);
  }, []);

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
      callDataRef.current = { callId: data.callId, retellCallId: data.retellCallId };
      setStep('calling');
      if (!data.demoMode && data.accessToken) {
        await startRetellCall(data.accessToken);
      }
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

  const stepIdx = STEP_INDEX[step];

  // Derive visualizer state
  const vizState = callEnded ? 'ended'
    : !callStarted ? 'connecting'
    : agentTalking ? 'agent'
    : callActive ? 'active'
    : 'idle';

  return (
    <div className="min-h-dvh bg-[#F8FAFC] flex flex-col">
      {/* ── Nav ── */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-[#00B894] tracking-tight">Klarity VoiceNote</Link>
        <span className="text-sm text-[#64748B] font-medium">Patient Intake</span>
      </nav>

      {/* ── Progress bar ── */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < stepIdx ? 'bg-[#00B894] text-white' :
                    i === stepIdx ? 'bg-[#00B894] text-white ring-4 ring-[#00B894]/20' :
                    'bg-[#E2E8F0] text-[#94A3B8]'
                  }`}>
                    {i < stepIdx ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-[11px] font-medium mt-1 ${i === stepIdx ? 'text-[#00B894]' : 'text-[#94A3B8]'}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-[2px] mx-2 mb-4 rounded transition-colors duration-500 ${i < stepIdx ? 'bg-[#00B894]' : 'bg-[#E2E8F0]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div key={step} {...fadeUp} className="w-full max-w-lg">

            {/* ── FORM ── */}
            {step === 'form' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="bg-gradient-to-br from-[#00B894]/5 to-[#00CEB8]/5 px-8 pt-8 pb-6 border-b border-[#E2E8F0]">
                  <h1 className="text-2xl font-bold text-[#0F172A]">Before your appointment</h1>
                  <p className="mt-1.5 text-[#64748B] text-sm leading-relaxed">
                    A quick voice conversation helps your provider prepare. Takes about 5 minutes.
                  </p>
                </div>

                <div className="px-8 py-6 space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex gap-3">
                    <span className="shrink-0 text-amber-500 text-base mt-0.5">⚠</span>
                    <p>
                      <strong className="text-amber-900">Not a therapist.</strong> This AI collects information only — no diagnosis, no treatment, no crisis support.
                      In danger: call <strong>911</strong> or text <strong>988</strong>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Your name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name as it appears in your records"
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">Appointment type</label>
                      <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15 focus:bg-white transition-all"
                      >
                        <option>Initial consultation</option>
                        <option>Initial psychiatry intake</option>
                        <option>Follow-up therapy</option>
                        <option>Medication management</option>
                        <option>Follow-up psychiatry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#0F172A] mb-1.5">
                        Age range <span className="text-[#94A3B8] font-normal">(optional)</span>
                      </label>
                      <select
                        value={ageRange}
                        onChange={(e) => setAgeRange(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/15 focus:bg-white transition-all"
                      >
                        <option value="">Prefer not to say</option>
                        <option>18–24</option>
                        <option>25–34</option>
                        <option>35–44</option>
                        <option>45–54</option>
                        <option>55+</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('consent')}
                    disabled={!name.trim()}
                    className="w-full bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── CONSENT ── */}
            {step === 'consent' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="bg-gradient-to-br from-blue-50 to-[#00B894]/5 px-8 pt-8 pb-6 border-b border-[#E2E8F0]">
                  <h1 className="text-2xl font-bold text-[#0F172A]">Before we begin</h1>
                  <p className="mt-1.5 text-[#64748B] text-sm">Please read and accept to continue.</p>
                </div>

                <div className="px-8 py-6 space-y-5">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 text-sm text-[#0F172A] leading-relaxed">
                    {[
                      { label: 'What this is', text: 'An AI voice assistant that collects intake information for your licensed provider.' },
                      { label: 'What this is not', text: 'Not therapy, diagnosis, treatment, or crisis support. This AI cannot make medical decisions.' },
                      { label: 'Your responses', text: 'Your conversation will be transcribed and summarized for your provider to review before your appointment.' },
                      { label: 'Emergency', text: 'If you are in immediate danger or thinking about harming yourself or others, call 911 or text 988 now.' },
                    ].map(({ label, text }) => (
                      <div key={label} className="flex gap-2">
                        <span className="shrink-0 text-[#00B894] font-bold mt-0.5">·</span>
                        <p><strong className="text-[#0F172A]">{label}:</strong> {text}</p>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={consented}
                        onChange={(e) => setConsented(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${consented ? 'bg-[#00B894] border-[#00B894]' : 'border-[#CBD5E1] group-hover:border-[#00B894]/60'}`}>
                        {consented && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-[#0F172A] leading-relaxed">
                      I understand this is an AI intake assistant, not a therapist. I consent to my responses being summarized for my provider&apos;s review.
                    </span>
                  </label>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setStep('form')}
                      className="flex-1 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl px-6 py-3.5 transition-colors border border-[#E2E8F0]"
                    >
                      Back
                    </button>
                    <button
                      onClick={startCall}
                      disabled={!consented || loading}
                      className="flex-1 bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-semibold rounded-xl px-6 py-3.5 transition-all duration-200 shadow-sm disabled:shadow-none"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Starting…
                        </span>
                      ) : 'Start Voice Intake'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── CALLING ── */}
            {step === 'calling' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className={`px-8 pt-8 pb-6 border-b border-[#E2E8F0] transition-colors duration-700 ${
                  callEnded ? 'bg-[#00B894]/5'
                  : callActive ? 'bg-gradient-to-br from-[#00B894]/8 to-[#00CEB8]/5'
                  : 'bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF]'
                }`}>
                  <h1 className="text-2xl font-bold text-[#0F172A]">
                    {callData?.demoMode ? 'Demo Mode'
                    : callEnded ? 'Call Complete'
                    : callStarted ? 'Voice Intake Active'
                    : 'Connecting…'}
                  </h1>
                  <p className="mt-1.5 text-[#64748B] text-sm">
                    {callData?.demoMode ? 'Retell not configured. Use demo transcript to generate a sample note.'
                    : callEnded ? 'Your intake has been saved. Processing your note…'
                    : callStarted ? 'Speak naturally. Share what brought you in and what you\'re hoping to get from your session.'
                    : 'Please allow microphone access when prompted.'}
                  </p>
                </div>

                <div className="px-8 py-8 space-y-6">
                  {callData?.demoMode ? (
                    <div className="space-y-4">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5">
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Demo transcript preview</p>
                        <p className="text-sm text-[#64748B] leading-relaxed line-clamp-4">
                          Patient reports increased anxiety for the past month, chest tightness at night, sleep disruption of 4–5 hours, academic stress from finals and grad school applications…
                        </p>
                      </div>
                      <button
                        onClick={useDemoTranscript}
                        disabled={demoLoading}
                        className="w-full bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white font-semibold rounded-xl px-6 py-3.5 transition-all"
                      >
                        {demoLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Generating note…
                          </span>
                        ) : 'Use Demo Transcript + Generate Note'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {retellError && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex gap-3">
                          <span className="shrink-0">⚠</span>
                          {retellError}
                        </div>
                      )}

                      {/* Voice visualizer */}
                      <div className={`rounded-2xl p-10 text-center transition-colors duration-700 ${
                        callEnded ? 'bg-[#00B894]/5' : 'bg-[#F8FAFC] border border-[#E2E8F0]'
                      }`}>
                        <VoiceVisualizer state={vizState} />
                        {!callEnded && callData?.callId && (
                          <p className="text-[10px] text-[#94A3B8] mt-5 tracking-widest uppercase">
                            {callActive ? `Call active · ${callData.callId.slice(-8)}` : `ID · ${callData.callId.slice(-8)}`}
                          </p>
                        )}
                      </div>

                      {/* Live transcript */}
                      {liveTranscript.length > 0 && (
                        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-3 max-h-52 overflow-y-auto">
                          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-widest">Live transcript</p>
                          {liveTranscript.map((u, i) => (
                            <div key={i} className={`flex gap-2 text-sm ${u.role === 'agent' ? 'text-[#00897B]' : 'text-[#0F172A]'}`}>
                              <span className="font-bold text-xs uppercase opacity-50 shrink-0 mt-0.5 w-12">
                                {u.role === 'agent' ? 'Agent' : 'You'}
                              </span>
                              <span className="leading-relaxed">{u.content}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {callActive && !callEnded && (
                        <button
                          onClick={stopRetellCall}
                          className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold rounded-xl px-6 py-3.5 transition-colors"
                        >
                          End Call
                        </button>
                      )}

                      {callEnded && (
                        <button
                          onClick={() => setStep('complete')}
                          className="w-full bg-[#00B894] hover:bg-[#00897B] text-white font-semibold rounded-xl px-6 py-3.5 transition-all shadow-sm"
                        >
                          View Summary →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── COMPLETE ── */}
            {step === 'complete' && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden">
                <div className="bg-gradient-to-br from-[#00B894]/8 to-[#00CEB8]/5 px-8 pt-10 pb-8 text-center">
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 h-20 bg-[#00B894] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#00B894]/30"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Intake Complete</h1>
                  <p className="mt-3 text-[#64748B] leading-relaxed text-sm max-w-sm mx-auto">
                    Your intake has been saved. Your provider will review your summary before the appointment — you don&apos;t need to do anything else.
                  </p>
                </div>

                <div className="px-8 py-6 space-y-4">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 flex gap-3">
                    <span className="text-[#00B894] text-lg shrink-0">ℹ</span>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      If this was urgent, please contact your provider directly or call 988 for crisis support.
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block text-center text-sm text-[#00B894] hover:text-[#00897B] transition-colors font-medium py-2"
                  >
                    View provider dashboard →
                  </Link>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
