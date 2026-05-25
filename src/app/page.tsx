import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-white text-lg">Klarity VoiceNote</span>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Provider Dashboard →
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Powered by Retell + Claude
            </div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              Voice intake that works<br />
              <span className="text-blue-400">before the appointment</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
              Patients speak naturally. Providers get structured notes, risk flags, and suggested questions — ready before the visit.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-left space-y-4">
            <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">Safety Notice</p>
            <p className="text-slate-400 text-sm leading-relaxed">
              This AI assistant collects intake information for your licensed provider. It does not provide therapy, diagnosis, treatment, or emergency support. If you are in immediate danger, call <strong className="text-white">911</strong> or text <strong className="text-white">988</strong> for crisis support.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/intake"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl px-8 py-4 transition-colors text-lg"
            >
              Start Voice Intake
              <span>→</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl px-8 py-4 transition-colors text-lg border border-slate-700"
            >
              Provider Dashboard
            </Link>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-800 px-6 py-4 text-center text-slate-600 text-sm">
        Built for Klarity Health · Powered by Retell AI · Deployed on Vercel
      </footer>
    </div>
  );
}
