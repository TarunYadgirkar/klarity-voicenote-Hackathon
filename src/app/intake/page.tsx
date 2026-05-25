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

const STEPS = ['Form', 'Consent', 'Call', 'Complete'];
const STEP_INDEX: Record<Step, number> = { form: 0, consent: 1, calling: 2, complete: 3 };

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.35 } };

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-[#00B894] tracking-tight">Klarity VoiceNote</Link>
        <span className="text-sm text-[#64748B] font-medium">Patient Intake</span>
      </nav>

      {/* Progress */}
      <div className="bg-white border-b border-[#E2E8F0] px-6 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                i < stepIdx ? 'bg-[#00B894] text-white' :
                i === stepIdx ? 'bg-[#00B894] text-white ring-4 ring-[#00B894]/20' :
                'bg-[#E2E8F0] text-[#64748B]'
              }`}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${i === stepIdx ? 'text-[#00B894]' : 'text-[#64748B]'}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 rounded ${i < stepIdx ? 'bg-[#00B894]' : 'bg-[#E2E8F0]'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div key={step} {...fadeUp} className="w-full max-w-lg">

            {/* FORM */}
            {step === 'form' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Before your appointment</h1>
                  <p className="mt-1 text-[#64748B] text-sm">Complete a short voice intake so your provider can prepare.</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <strong className="text-amber-900">Not a therapist.</strong> This AI collects information only. Cannot diagnose, treat, or provide emergency support. In crisis: call 911 or text 988.
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Your name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name (as it appears in your records)"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Appointment type</label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/20 transition-colors"
                    >
                      <option>Initial consultation</option>
                      <option>Initial psychiatry intake</option>
                      <option>Follow-up therapy</option>
                      <option>Medication management</option>
                      <option>Follow-up psychiatry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Age range <span className="text-[#64748B] font-normal">(optional)</span></label>
                    <select
                      value={ageRange}
                      onChange={(e) => setAgeRange(e.target.value)}
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0F172A] focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/20 transition-colors"
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
                  className="w-full bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-semibold rounded-xl px-6 py-3.5 transition-colors shadow-sm"
                >
                  Continue
                </button>
              </div>
            )}

            {/* CONSENT */}
            {step === 'consent' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Before we begin</h1>
                  <p className="mt-1 text-[#64748B] text-sm">Please read and accept before starting the intake.</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 space-y-3 text-sm text-[#0F172A] leading-relaxed">
                  <p><strong>What this is:</strong> An AI voice assistant that collects intake information for your licensed provider at Klarity Health.</p>
                  <p><strong>What this is not:</strong> This is not therapy, diagnosis, treatment, or crisis support. This AI cannot make medical decisions.</p>
                  <p><strong>Your responses:</strong> Your conversation will be transcribed and summarized. Your provider will review the summary before your appointment.</p>
                  <p><strong>Emergency:</strong> If you are in immediate danger or thinking about harming yourself or others, call 911 or text 988 now.</p>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => setConsented(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded accent-[#00B894]"
                  />
                  <span className="text-sm text-[#0F172A]">
                    I understand this is an AI intake assistant, not a therapist. I consent to my responses being summarized for my provider&apos;s review.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold rounded-xl px-6 py-3.5 transition-colors border border-[#E2E8F0]"
                  >
                    Back
                  </button>
                  <button
                    onClick={startCall}
                    disabled={!consented || loading}
                    className="flex-1 bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-semibold rounded-xl px-6 py-3.5 transition-colors shadow-sm"
                  >
                    {loading ? 'Starting...' : 'Start Voice Intake'}
                  </button>
                </div>
              </div>
            )}

            {/* CALLING */}
            {step === 'calling' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">
                    {callData?.demoMode ? 'Demo Mode' : callEnded ? 'Call Ended' : callStarted ? 'Voice Intake Active' : 'Connecting…'}
                  </h1>
                  <p className="mt-1 text-[#64748B] text-sm">
                    {callData?.demoMode
                      ? 'Retell not configured. Use demo transcript to generate a sample note.'
                      : callEnded ? 'Processing your intake…'
                      : callStarted ? 'Speak naturally with the AI intake assistant.'
                      : 'Please allow microphone access when prompted.'}
                  </p>
                </div>

                {callData?.demoMode ? (
                  <div className="space-y-4">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
                      <p className="text-sm font-medium text-[#0F172A] mb-2">Demo transcript preview:</p>
                      <p className="text-xs text-[#64748B] leading-relaxed line-clamp-4">
                        Patient reports increased anxiety for the past month, chest tightness at night, sleep disruption of 4-5 hours, academic stress from finals and grad school applications…
                      </p>
                    </div>
                    <button
                      onClick={useDemoTranscript}
                      disabled={demoLoading}
                      className="w-full bg-[#00B894] hover:bg-[#00897B] disabled:bg-[#E2E8F0] disabled:text-[#64748B] text-white font-semibold rounded-xl px-6 py-3.5 transition-colors shadow-sm"
                    >
                      {demoLoading ? 'Generating note…' : 'Use Demo Transcript + Generate Note'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {retellError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                        {retellError}
                      </div>
                    )}

                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-4">
                      <div className="relative w-20 h-20 mx-auto">
                        {agentTalking && (
                          <span className="absolute inset-0 rounded-full bg-[#00B894]/20 animate-ping" />
                        )}
                        <div className="w-20 h-20 bg-[#00B894]/10 rounded-full flex items-center justify-center">
                          <div className={`w-8 h-8 rounded-full transition-colors duration-300 ${
                            callEnded ? 'bg-[#E2E8F0]'
                            : callActive ? agentTalking ? 'bg-[#00CEB8] animate-pulse' : 'bg-[#00B894]'
                            : 'bg-[#E2E8F0] animate-pulse'
                          }`} />
                        </div>
                      </div>
                      <p className="text-[#64748B] text-sm">
                        {callEnded ? 'Call ended. Processing your intake…'
                        : callActive ? agentTalking ? 'Agent is speaking…' : 'Listening… speak when ready.'
                        : 'Connecting to AI intake assistant…'}
                      </p>
                      <p className="text-xs text-[#64748B]/60">Call ID: {callData?.callId}</p>
                    </div>

                    {liveTranscript.length > 0 && (
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-3">Live transcript</p>
                        {liveTranscript.map((u, i) => (
                          <div key={i} className={`text-sm ${u.role === 'agent' ? 'text-[#00897B]' : 'text-[#0F172A]'}`}>
                            <span className="font-semibold text-xs uppercase mr-2 opacity-60">
                              {u.role === 'agent' ? 'Agent' : 'You'}
                            </span>
                            {u.content}
                          </div>
                        ))}
                      </div>
                    )}

                    {callActive && !callEnded && (
                      <button
                        onClick={stopRetellCall}
                        className="w-full bg-[#EF4444] hover:bg-red-600 text-white font-semibold rounded-xl px-6 py-3.5 transition-colors"
                      >
                        End Call
                      </button>
                    )}

                    {callEnded && (
                      <button
                        onClick={() => setStep('complete')}
                        className="w-full bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] font-semibold rounded-xl px-6 py-3.5 transition-colors border border-[#E2E8F0]"
                      >
                        View Summary →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* COMPLETE */}
            {step === 'complete' && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-[#00B894]/10 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-4xl text-[#00B894]">✓</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">Intake Complete</h1>
                  <p className="mt-3 text-[#64748B] leading-relaxed text-sm">
                    Your intake has been saved. Your provider will review your summary before the appointment.
                  </p>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-sm text-[#64748B]">
                  You do not need to do anything else. If this was urgent, please contact your provider directly.
                </div>
                <Link href="/dashboard" className="inline-block text-[#00B894] hover:text-[#00897B] transition-colors font-medium text-sm">
                  View provider dashboard →
                </Link>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
