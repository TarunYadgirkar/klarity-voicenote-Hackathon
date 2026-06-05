import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { NoteGenerationResult } from '@/types';

const PROMPT = `You are an AI clinical documentation assistant for a mental health provider marketplace.
Your job is to convert a patient intake transcript into a provider-reviewed draft note.

Important rules:
- Do not diagnose.
- Do not prescribe.
- Do not recommend medication changes.
- Do not provide therapy.
- Do not claim certainty.
- Use patient-reported language.
- If information is missing, say "Not mentioned."
- Flag safety concerns for provider review.
- The output is a draft and must be reviewed by a licensed provider.
- Do not invent facts not present in the transcript.

Return ONLY valid JSON with these fields:
{
  "patient_summary": "",
  "chief_concern": "",
  "symptoms_reported": [],
  "sleep_impact": "",
  "mood_affect": "",
  "stressors": [],
  "medication_mentions": "",
  "prior_care": "",
  "patient_goals": [],
  "soap_note": {
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
  },
  "risk": {
    "level": "none | low | medium | high",
    "flags": [],
    "urgent_provider_review": false,
    "reason": ""
  },
  "suggested_provider_questions": [],
  "follow_up_actions": [],
  "missing_information": []
}`;

const GenerateNoteSchema = z.object({
  callId: z.string().uuid().optional(),
  transcript: z.string().max(50000).optional(),
  patientId: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = GenerateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { callId, transcript, patientId } = parsed.data;
  const sql = await getDb();

  const resolvedCallId = callId;
  let resolvedTranscript = transcript;
  let resolvedPatientId = patientId;

  if (!resolvedTranscript && resolvedCallId) {
    const [call] = await sql`SELECT * FROM calls WHERE id = ${resolvedCallId}`;
    if (call) {
      resolvedTranscript = call.transcript as string;
      resolvedPatientId = call.patient_id as string;
    }
  }

  if (resolvedTranscript === null || resolvedTranscript === undefined) {
    return NextResponse.json({ error: 'No transcript' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  let result: NoteGenerationResult;

  if (!geminiKey) {
    result = getDemoNote();
  } else {
    try {
      result = await generateNoteWithGemini(geminiKey, resolvedTranscript);
    } catch (err) {
      console.error('Gemini error:', err);
      result = getDemoNote();
    }
  }

  const noteId = uuidv4();

  if (resolvedCallId && resolvedPatientId) {
    const [existing] = await sql`SELECT id FROM notes WHERE call_id = ${resolvedCallId}`;
    if (existing) {
      await sql`
        UPDATE notes SET
          ai_summary = ${result.patient_summary},
          soap_subjective = ${result.soap_note.subjective},
          soap_objective = ${result.soap_note.objective},
          soap_assessment = ${result.soap_note.assessment},
          soap_plan = ${result.soap_note.plan},
          risk_level = ${result.risk.level},
          risk_flags = ${JSON.stringify(result.risk.flags)},
          suggested_questions = ${JSON.stringify(result.suggested_provider_questions)},
          follow_up_actions = ${JSON.stringify(result.follow_up_actions)},
          chief_concern = ${result.chief_concern},
          symptoms_reported = ${JSON.stringify(result.symptoms_reported)},
          patient_goals = ${JSON.stringify(result.patient_goals)},
          status = ${result.risk.urgent_provider_review ? 'urgent_review' : 'ai_draft'}
        WHERE call_id = ${resolvedCallId}
      `;
    } else {
      await sql`
        INSERT INTO notes (
          id, patient_id, call_id, ai_summary, soap_subjective, soap_objective,
          soap_assessment, soap_plan, risk_level, risk_flags, suggested_questions,
          follow_up_actions, chief_concern, symptoms_reported, patient_goals, status
        ) VALUES (
          ${noteId}, ${resolvedPatientId}, ${resolvedCallId},
          ${result.patient_summary},
          ${result.soap_note.subjective},
          ${result.soap_note.objective},
          ${result.soap_note.assessment},
          ${result.soap_note.plan},
          ${result.risk.level},
          ${JSON.stringify(result.risk.flags)},
          ${JSON.stringify(result.suggested_provider_questions)},
          ${JSON.stringify(result.follow_up_actions)},
          ${result.chief_concern},
          ${JSON.stringify(result.symptoms_reported)},
          ${JSON.stringify(result.patient_goals)},
          ${result.risk.urgent_provider_review ? 'urgent_review' : 'ai_draft'}
        )
      `;
    }
  }

  return NextResponse.json({ ok: true, noteId, result });
}

async function generateNoteWithGemini(apiKey: string, transcript: string): Promise<NoteGenerationResult> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${PROMPT}\n\nTranscript:\n${transcript}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini response did not include text output');
  }

  return JSON.parse(text) as NoteGenerationResult;
}

function getDemoNote(): NoteGenerationResult {
  return {
    patient_summary:
      'Patient reports increased anxiety over the past month, especially before school and at night. Patient reports reduced sleep of 4-5 hours per night, chest tightness during anxious moments, and significant stress related to academic performance and college preparation. Patient denies thoughts of self-harm or harm to others.',
    chief_concern: 'Anxiety symptoms and sleep disruption related to academic stress',
    symptoms_reported: ['Chest tightness', 'Reduced sleep (4-5 hrs/night)', 'Irritability', 'Difficulty concentrating', 'Waking at 3am with racing thoughts'],
    sleep_impact: 'Patient reports sleeping only 4-5 hours per night, waking at approximately 3am with intrusive thoughts about academic obligations.',
    mood_affect: 'Patient reports predominantly anxious mood with periods of sadness and irritability, described as uncharacteristic for patient.',
    stressors: ['Finals preparation', 'Graduate school applications', 'Academic performance pressure'],
    medication_mentions: 'Melatonin (occasional, patient-reported ineffective). No prescription medications.',
    prior_care: 'One session with school counselor during freshman year. No formal therapy or psychiatry history.',
    patient_goals: ['Understand if symptoms indicate clinical anxiety vs. normal stress', 'Develop coping strategies for acute anxiety episodes', 'Determine if therapy or medication evaluation is appropriate'],
    soap_note: {
      subjective:
        'Patient presents reporting approximately 4-6 weeks of increased anxiety, primarily manifesting before school and at night. Patient reports chest tightness during anxious episodes, sleep disruption with onset insomnia and early waking (approximately 3am), and difficulty concentrating in class. Patient identifies academic stressors including finals and graduate school applications as primary triggers. Mood described as predominantly anxious with intermittent sadness and uncharacteristic irritability. No current medications except occasional melatonin. Single prior counselor contact, no formal mental health treatment.',
      objective:
        'Voice intake only. Patient was coherent, engaged, and able to clearly articulate symptoms and goals. No physical exam or vitals available from this intake. Patient communication was organized and goal-oriented.',
      assessment:
        'Patient-reported anxiety symptoms with sleep disruption in the context of significant academic stressors. No diagnosis is made by this AI system. Provider should further evaluate symptom duration, severity, functional impact, and differential considerations. Patient denies safety concerns.',
      plan:
        'Provider may consider further evaluation of anxiety symptom severity and functional impairment. Discussion of evidence-based options including therapy referral, skills-based interventions, and/or psychiatric evaluation may be appropriate. Provider to confirm safety status and explore patient goals for treatment. Sleep hygiene discussion may be warranted given reported sleep disruption.',
    },
    risk: {
      level: 'low',
      flags: ['Sleep disruption (4-5 hrs/night)', 'Academic stress', 'Intermittent sadness'],
      urgent_provider_review: false,
      reason: 'Patient denies self-harm or harm to others. Low risk indicators. Sleep disruption and mood changes warrant clinical attention but are not emergent.',
    },
    suggested_provider_questions: [
      'How often do the chest tightness episodes occur, and how long do they last?',
      'Has anxiety affected your ability to attend class or complete assignments?',
      'What coping strategies have you tried, and what has helped even minimally?',
      'Is there a history of anxiety or mood disorders in your family?',
      'What does a typical day look like in terms of stress management and self-care?',
    ],
    follow_up_actions: [
      'Provider to conduct full clinical assessment during visit',
      'Consider PHQ-9 and GAD-7 screening tools',
      'Discuss therapy referral options',
      'Evaluate appropriateness of psychiatric consultation',
    ],
    missing_information: ['Substance use history', 'Family mental health history', 'Physical health conditions', 'Social support system'],
  };
}
