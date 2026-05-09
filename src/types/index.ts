export interface Patient {
  id: string;
  name: string;
  age_range?: string;
  appointment_type?: string;
  provider_name?: string;
  created_at?: string;
}

export interface Call {
  id: string;
  patient_id: string;
  retell_call_id?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  transcript?: string;
  duration_seconds?: number;
  created_at?: string;
  completed_at?: string;
}

export interface Note {
  id: string;
  patient_id: string;
  call_id: string;
  ai_summary?: string;
  soap_subjective?: string;
  soap_objective?: string;
  soap_assessment?: string;
  soap_plan?: string;
  risk_level: 'none' | 'low' | 'medium' | 'high';
  risk_flags: string[];
  suggested_questions: string[];
  follow_up_actions: string[];
  chief_concern?: string;
  symptoms_reported: string[];
  patient_goals: string[];
  status: 'ai_draft' | 'reviewed' | 'urgent_review';
  provider_edited_note?: string;
  reviewed_at?: string;
  created_at?: string;
}

export interface NoteGenerationResult {
  patient_summary: string;
  chief_concern: string;
  symptoms_reported: string[];
  sleep_impact: string;
  mood_affect: string;
  stressors: string[];
  medication_mentions: string;
  prior_care: string;
  patient_goals: string[];
  soap_note: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  risk: {
    level: 'none' | 'low' | 'medium' | 'high';
    flags: string[];
    urgent_provider_review: boolean;
    reason: string;
  };
  suggested_provider_questions: string[];
  follow_up_actions: string[];
  missing_information: string[];
}
