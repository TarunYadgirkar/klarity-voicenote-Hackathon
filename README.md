# Klarity VoiceNote

> Retell-powered AI voice intake that turns patient conversations into provider-reviewed mental health notes.

## What it does

Patients complete a natural voice intake before a psychiatry or therapy visit. The AI collects patient-reported context, then generates a structured SOAP note draft, risk flags, and suggested provider questions — ready before the appointment.

**Not a therapist. Not a diagnosis tool. A documentation assistant.**

## Sponsors

- **Retell AI** — voice conversation + post-call analysis
- **Google Gemini** — transcript → structured SOAP note generation
- **Zeabur** — deployment
- **Klarity Health** — target customer (mental health practice workflow)

## Stack

- Next.js 16 (App Router)
- Tailwind CSS
- Retell SDK
- Google Gemini API (gemini-2.5-flash-lite)
- SQLite (better-sqlite3)
- Zeabur

## Local setup

```bash
npm install
cp .env.example .env.local
# Add RETELL_API_KEY, RETELL_AGENT_ID, GEMINI_API_KEY
npm run dev
```

Works in demo mode without any API keys — uses a preloaded transcript + note fallback.

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/intake` | Patient voice intake flow |
| `/dashboard` | Provider queue with risk badges |
| `/dashboard/[noteId]` | Full note review + approve |

## Env vars

```
RETELL_API_KEY=
RETELL_AGENT_ID=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
NEXT_PUBLIC_APP_URL=https://your-zeabur-url
```

## Retell webhook

Set your Retell agent webhook URL to: `https://your-domain/api/retell-webhook`
