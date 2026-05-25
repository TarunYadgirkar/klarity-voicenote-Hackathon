# Klarity VoiceNote

> AI-powered voice intake that converts patient conversations into structured mental health documentation — ready before the appointment.

**Live:** https://klarity-voicenote.vercel.app

---

## Why

Mental health providers spend significant time at the start of every appointment gathering basic context — chief concern, symptom history, current stressors, goals. This is repetitive, time-consuming, and often incomplete when done on paper or through static forms.

Patients also struggle to articulate complex emotional experiences under time pressure in a clinical setting. Speaking naturally before the visit — without a provider watching — produces richer, more honest intake data.

Klarity VoiceNote moves intake out of the appointment and into the patient's own time. The AI handles collection; the provider gets structured, reviewable documentation waiting for them.

---

## What

Klarity VoiceNote is a documentation assistant for mental health practices. It is **not** a therapist, diagnostic tool, or clinical decision system.

### Patient flow
1. Patient visits the intake link before their appointment
2. Completes a short form (name, appointment type, age range)
3. Reviews and accepts a safety consent
4. Speaks naturally with an AI voice agent (powered by Retell AI)
5. Receives confirmation — no further action needed

### Provider flow
1. Opens the provider dashboard
2. Sees all patients in the intake queue with AI-assigned risk levels
3. Clicks into any note to review the full AI-generated documentation
4. Can override the risk level, edit the SOAP note, and approve it
5. Approved notes are marked as provider-reviewed

### What the AI generates per call
- **Patient summary** — plain-language overview of what the patient shared
- **Chief concern** — primary presenting issue in patient's own words
- **SOAP note draft** — Subjective, Objective, Assessment, Plan
- **Risk level** — none / low / medium / high (AI-assigned, provider-editable)
- **Risk flags** — specific concerns flagged for provider attention
- **Patient-reported symptoms** — structured list
- **Patient goals** — what the patient wants from the appointment
- **Suggested provider questions** — generated from gaps in the intake
- **Follow-up actions** — recommended next steps for provider review
- **Full transcript** — available on demand in the note view

---

## How

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Voice AI | Retell AI (browser SDK + server SDK) |
| Note generation | Google Gemini API (`gemini-2.5-flash-lite`) |
| Database | Neon — serverless Postgres |
| Deployment | Vercel |

### Architecture

```
Browser (patient)
  └─ /intake page
       ├─ POST /api/create-web-call   → creates patient + call record in DB, gets Retell access token
       ├─ RetellWebClient (browser)   → live WebRTC audio call with Retell AI agent
       └─ on call_ended
            └─ POST /api/fetch-retell-call
                 ├─ fetches transcript from Retell API (retries up to 3×)
                 ├─ updates call record (status=completed, transcript)
                 └─ POST /api/generate-note
                      ├─ sends transcript to Gemini with clinical documentation prompt
                      ├─ parses structured JSON response
                      └─ saves note to DB

Browser (provider)
  └─ /dashboard
       ├─ GET /api/patients           → polls every 5s, returns patients + joined call/note data
       └─ /dashboard/[noteId]
            ├─ GET /api/notes/[id]    → full note with parsed JSON arrays
            └─ PATCH /api/notes/[id]  → update status, risk level, or provider-edited note text
```

### Database schema

Three core tables in Neon Postgres:

**patients** — one row per intake form submission
```
id, name, age_range, appointment_type, provider_name, created_at
```

**calls** — one row per Retell call
```
id, patient_id, retell_call_id, status, transcript, duration_seconds, created_at, completed_at
```

**notes** — one row per AI-generated note (linked to a call)
```
id, patient_id, call_id, ai_summary, soap_subjective, soap_objective,
soap_assessment, soap_plan, risk_level, risk_flags, suggested_questions,
follow_up_actions, chief_concern, symptoms_reported, patient_goals,
status, provider_edited_note, reviewed_at, created_at
```

### Gemini prompt design

The prompt instructs Gemini to act as a clinical documentation assistant with strict rules:
- No diagnosis, no prescriptions, no medication recommendations
- Patient-reported language only
- Flag missing information explicitly
- Output strict JSON matching a typed schema
- Mark all output as draft requiring provider review

The model is `gemini-2.5-flash-lite` — chosen for free-tier availability and sufficient capability for structured JSON extraction from transcripts.

### Risk level

Gemini assigns an initial risk level (none / low / medium / high) based on transcript content. Providers can override this directly from the dashboard row or the full note view. High-risk patients surface an urgent review banner at the top of the dashboard.

---

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill in env vars (see below)
npm run dev
```

**Demo mode** — works without any API keys. Uses a preloaded transcript and generates a fallback note. Set `RETELL_API_KEY` to trigger real voice calls; set `GEMINI_API_KEY` to generate real notes from transcripts.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `RETELL_API_KEY` | Yes | Retell API key (from retellai.com) |
| `RETELL_AGENT_ID` | Yes | Retell agent ID to use for web calls |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (aistudio.google.com) |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash-lite` |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of your deployment (used for internal API calls) |

## Routes

| Route | Description |
|---|---|
| `GET /` | Landing page |
| `GET /intake` | Patient voice intake flow |
| `GET /dashboard` | Provider queue — all patients with risk and note status |
| `GET /dashboard/[noteId]` | Full note review, edit, risk override, approve |
| `POST /api/create-web-call` | Create patient + call record, get Retell access token |
| `POST /api/fetch-retell-call` | Fetch transcript from Retell, trigger note generation |
| `POST /api/generate-note` | Send transcript to Gemini, save structured note |
| `POST /api/demo-note` | Generate note from preloaded demo transcript |
| `GET /api/patients` | List all patients with joined call/note data |
| `GET /api/notes/[id]` | Fetch single note |
| `PATCH /api/notes/[id]` | Update note status, risk level, or provider-edited text |
| `GET /api/calls/[id]` | Fetch call record (used for transcript display) |
| `POST /api/retell-webhook` | Retell server webhook (backup trigger for note generation) |

## Retell webhook (optional)

Set your Retell agent's webhook URL to `https://your-domain/api/retell-webhook`. This is a backup trigger — note generation is primarily triggered client-side on `call_ended`.

---

## Safety

This system is a documentation assistant only. It:
- Does not provide therapy, diagnosis, or treatment
- Does not make clinical decisions
- Does not replace provider judgment
- Displays mandatory safety notices to patients before intake
- Flags all AI output as draft requiring provider review

In-app crisis messaging directs patients to 911 and 988 (Suicide & Crisis Lifeline).
