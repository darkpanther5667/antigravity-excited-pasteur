// ─── Result Page Types ────────────────────────────────────────────────────────

export interface ResultResponse {
  question_id: string;
  question_text: string;
  subject: string;
  chapter: string;
  topic: string | null;
  type: 'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX';
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;      // safe to expose post-submission
  solution: string | null;
  selected_answer: string | null;
  is_correct: boolean | null;
  marks_awarded: number;
  time_spent_seconds: number;
  status: 'ANSWERED' | 'MARKED_REVIEW' | 'UNANSWERED' | 'NOT_VISITED';
}

export type ReviewFilter =
  | 'all'
  | 'correct'
  | 'incorrect'
  | 'unattempted'
  | 'marked';

export type SubjectFilter = 'all' | 'PHYSICS' | 'CHEMISTRY' | 'MATHS';

export interface SectionBreakdown {
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
}

export interface ResultData {
  attempt_id: string;
  test: {
    id: string;
    title: string;
    type: string;
    exam_type: string | null;
    duration_minutes: number;
    total_marks: number;
  };
  scores: {
    total: number;
    physics: number;
    chemistry: number;
    maths: number;
    max_possible: number;
  };
  stats: {
    attempted: number;
    correct: number;
    incorrect: number;
    unanswered: number;
    time_taken_seconds: number;
    percentile: number | null;
    rank: number | null;
  };
  section_breakdown: {
    physics: SectionBreakdown;
    chemistry: SectionBreakdown;
    maths: SectionBreakdown;
  };
  responses: ResultResponse[];
}
