'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

// Dynamically imported to avoid SSR issues with browser audio APIs.
// RetellWebClient accesses window/navigator so it must only run client-side.
type RetellWebClientType = import('retell-client-js-sdk').RetellWebClient;

type Step = 'form' | 'consent' | 'calling' | 'complete';

interface TranscriptUtterance {
  role: 'agent' | 'user';
  content: string;
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

  // Retell live call state
  const [callActive, setCallActive] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [retellError, setRetellError] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState<TranscriptUtterance[]>([]);
  const [agentTalking, setAgentTalking] = useState(false);

  const retellClientRef = useRef<RetellWebClientType | null>(null);
  const callDataRef = useRef<{ callId: string; retellCallId?: string } | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const startRetellCall = useCallback(async (accessToken: string) => {
    try {
      // Dynamic import keeps RetellWebClient out of SSR bundle
      const { RetellWebClient } = await import('retell-client-js-sdk');
      const client = new RetellWebClient();
      retellClientRef.current = client;

      client.on('call_started', () => {
        setCallStarted(true);
        setCallActive(true);
        setRetellError(null);
      });

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
        // update.transcript is the last ~5 utterances
        if (update && Array.isArray(update.transcript)) {
          setLiveTranscript(
            update.transcript.map((u: { role: string; content: string }) => ({
              role: u.role as 'agent' | 'user',
              content: u.content,
            }))
          );
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

  // ── API calls ─────────────────────────────────────────────────────────────

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

      // If we got a real accessToken, start the browser audio call immediately
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

  // ── render ────────────────────────────────────────────────────────────────

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

          {/* ── FORM ─────────────────────────────────────────────── */}
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
                    placeholder="Full name (as it appears in your records)"
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

          {/* ── CONSENT ──────────────────────────────────────────── */}
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

          {/* ── CALLING ──────────────────────────────────────────── */}
          {step === 'calling' && (
            <>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {callData?.demoMode ? 'Demo Mode' : callEnded ? 'Call Ended' : callStarted ? 'Voice Intake Active' : 'Connecting…'}
                </h1>
                <p className="mt-2 text-slate-400">
                  {callData?.demoMode
                    ? 'Retell not configured. Use demo transcript to generate a sample note.'
                    : callEnded
                    ? 'Processing your intake…'
                    : callStarted
                    ? 'Speak naturally with the AI intake assistant.'
                    : 'Please allow microphone access when prompted.'}
                </p>
              </div>

              {/* ── DEMO MODE ── */}
              {callData?.demoMode ? (
                <div className="space-y-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
                    <p className="text-sm font-medium text-slate-300">Demo transcript preview:</p>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-4">
                      Patient reports increased anxiety for the past month, chest tightness at night, sleep disruption of 4-5 hours, academic stress from finals and grad school applications…
                    </p>
                  </div>
                  <button
                    onClick={useDemoTranscript}
                    disabled={demoLoading}
                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                  >
                    {demoLoading ? 'Generating note…' : 'Use Demo Transcript + Generate Note'}
                  </button>
                </div>
              ) : (
                /* ── LIVE RETELL CALL ── */
                <div className="space-y-4">
                  {/* Error banner */}
                  {retellError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-300">
                      {retellError}
                    </div>
                  )}

                  {/* Audio visualiser / status orb */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      {/* Outer pulse ring – active when agent is talking */}
                      {agentTalking && (
                        <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                      )}
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full transition-colors duration-300 ${
                            callEnded
                              ? 'bg-slate-500'
                              : callActive
                              ? agentTalking
                                ? 'bg-blue-400 animate-pulse'
                                : 'bg-blue-500'
                              : 'bg-slate-600 animate-pulse'
                          }`}
                        />
                      </div>
                    </div>

                    <p className="text-slate-300">
                      {callEnded
                        ? 'Call ended. Processing your intake…'
                        : callActive
                        ? agentTalking
                          ? 'Agent is speaking…'
                          : 'Listening… speak when ready.'
                        : 'Connecting to AI intake assistant…'}
                    </p>
                    <p className="text-xs text-slate-500">Call ID: {callData?.callId}</p>
                  </div>

                  {/* Live transcript */}
                  {liveTranscript.length > 0 && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Live transcript</p>
                      {liveTranscript.map((u, i) => (
                        <div key={i} className={`text-sm ${u.role === 'agent' ? 'text-blue-300' : 'text-slate-300'}`}>
                          <span className="font-semibold text-xs uppercase mr-2 opacity-60">
                            {u.role === 'agent' ? 'Agent' : 'You'}
                          </span>
                          {u.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* End Call button — only shown once the call is active and not yet ended */}
                  {callActive && !callEnded && (
                    <button
                      onClick={stopRetellCall}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                    >
                      End Call
                    </button>
                  )}

                  {/* Fallback manual advance — only visible after call ends without auto-redirect */}
                  {callEnded && (
                    <button
                      onClick={() => setStep('complete')}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
                    >
                      View Summary →
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── COMPLETE ─────────────────────────────────────────── */}
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
              <Link href="/dashboard" className="inline-block text-blue-400 hover:text-blue-300 transition-colors">
                View provider dashboard →
              </Link>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
