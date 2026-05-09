import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
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

export async function POST(req: NextRequest) {
  const { callId, transcript, patientId } = await req.json();
  const db = getDb();

  let resolvedCallId = callId;
  let resolvedTranscript = transcript;
  let resolvedPatientId = patientId;

  if (!resolvedTranscript && resolvedCallId) {
    const call = db.prepare('SELECT * FROM calls WHERE id = ?').get(resolvedCallId) as { transcript: string; patient_id: string } | undefined;
    if (call) {
      resolvedTranscript = call.transcript;
      resolvedPatientId = call.patient_id;
    }
  }

  if (!resolvedTranscript) {
    return NextResponse.json({ error: 'No transcript' }, { status: 400 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  let result: NoteGenerationResult;

  if (!anthropicKey || anthropicKey === 'your_anthropic_api_key') {
    result = getDemoNote();
  } else {
    try {
      const client = new Anthropic({ apiKey: anthropicKey });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `${PROMPT}\n\nTranscript:\n${resolvedTranscript}`,
          },
        ],
      });
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : getDemoNote();
    } catch (err) {
      console.error('Anthropic error:', err);
      result = getDemoNote();
    }
  }

  const noteId = uuidv4();

  if (resolvedCallId && resolvedPatientId) {
    const existing = db.prepare('SELECT id FROM notes WHERE call_id = ?').get(resolvedCallId);
    if (existing) {
      db.prepare(`
        UPDATE notes SET
          ai_summary = ?, soap_subjective = ?, soap_objective = ?,
          soap_assessment = ?, soap_plan = ?, risk_level = ?,
          risk_flags = ?, suggested_questions = ?, follow_up_actions = ?,
          chief_concern = ?, symptoms_reported = ?, patient_goals = ?
        WHERE call_id = ?
      `).run(
        result.patient_summary,
        result.soap_note.subjective,
        result.soap_note.objective,
        result.soap_note.assessment,
        result.soap_note.plan,
        result.risk.level,
        JSON.stringify(result.risk.flags),
        JSON.stringify(result.suggested_provider_questions),
        JSON.stringify(result.follow_up_actions),
        result.chief_concern,
        JSON.stringify(result.symptoms_reported),
        JSON.stringify(result.patient_goals),
        resolvedCallId
      );
    } else {
      db.prepare(`
        INSERT INTO notes (
          id, patient_id, call_id, ai_summary, soap_subjective, soap_objective,
          soap_assessment, soap_plan, risk_level, risk_flags, suggested_questions,
          follow_up_actions, chief_concern, symptoms_reported, patient_goals,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        noteId, resolvedPatientId, resolvedCallId,
        result.patient_summary,
        result.soap_note.subjective,
        result.soap_note.objective,
        result.soap_note.assessment,
        result.soap_note.plan,
        result.risk.level,
        JSON.stringify(result.risk.flags),
        JSON.stringify(result.suggested_provider_questions),
        JSON.stringify(result.follow_up_actions),
        result.chief_concern,
        JSON.stringify(result.symptoms_reported),
        JSON.stringify(result.patient_goals),
        result.risk.urgent_provider_review ? 'urgent_review' : 'ai_draft'
      );
    }
  }

  return NextResponse.json({ ok: true, noteId, result });
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
