// ─── Question Types ──────────────────────────────────────────────────────────

export type QuestionType = 'SINGLE' | 'MULTI' | 'INTEGER' | 'MATRIX';
export type SectionName = 'PHYSICS' | 'CHEMISTRY' | 'MATHS';

// Status aligned with backend Response.status enum
export type ResponseStatus =
  | 'NOT_VISITED'      // never opened
  | 'VISITED'          // opened but no answer
  | 'ANSWERED'         // has an answer saved
  | 'MARKED'           // marked for review, no answer
  | 'ANSWERED_MARKED'; // has an answer AND marked for review

// ─── Backend Question Shape (sanitized for attempt) ───────────────────────────

export interface AttemptQuestion {
  id: string;
  subject: SectionName;
  chapter: string;
  topic: string;
  difficulty: string;
  type: QuestionType;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  year: number | null;
  exam_type: string | null;
  nta_weightage: number | null;
  question_order: number;
  // Matrix-specific (if backend provides matrix options as JSON)
  matrix_options?: MatrixOptions | null;
}

// ─── Matrix Type ─────────────────────────────────────────────────────────────

export interface MatrixOptions {
  rows: string[];    // e.g. ["A", "B", "C", "D"]
  cols: string[];    // e.g. ["P", "Q", "R", "S"]
}

// Each cell key = "row_col" e.g. "A_P"
export type MatrixAnswer = Record<string, boolean>;

// ─── Answer Draft Model ───────────────────────────────────────────────────────

// The in-memory answer for a question (before save)
export interface AnswerDraft {
  questionId: string;
  // For SINGLE: option letter "A"|"B"|"C"|"D"
  // For MULTI: comma-separated e.g. "A,C"
  // For INTEGER: numeric string e.g. "42"
  // For MATRIX: JSON string of MatrixAnswer
  selectedAnswer: string | null;
  status: ResponseStatus;
}

// ─── Palette State ─────────────────────────────────────────────────────────────

export interface PaletteEntry {
  questionId: string;
  questionIndex: number; // 0-based global index
  sectionIndex: number;  // 0-based within section
  section: SectionName;
  status: ResponseStatus;
}

// ─── Section Model ────────────────────────────────────────────────────────────

export interface SectionState {
  name: SectionName;
  questions: AttemptQuestion[];
  // Derived counts
  counts: {
    notVisited: number;
    visited: number;
    answered: number;
    marked: number;
    answeredMarked: number;
  };
}

// ─── Save State Model ─────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveState {
  status: SaveStatus;
  lastSavedAt: Date | null;
  errorMessage: string | null;
}

// ─── Timer State Model ────────────────────────────────────────────────────────

export interface TimerState {
  timeRemainingSeconds: number;
  isExpired: boolean;
}

// ─── Full Session State ────────────────────────────────────────────────────────

export interface AttemptSession {
  attemptId: string;
  testId: string;
  testTitle: string;
  examType: string | null;
  totalMarks: number;
  durationMinutes: number;

  // Questions grouped by section, in order
  sections: SectionState[];
  // All questions flattened for global index lookup
  allQuestions: AttemptQuestion[];

  // Current position
  activeSection: SectionName;
  activeQuestionIndex: number; // global index into allQuestions

  // Answers (local truth)
  answers: Record<string, AnswerDraft>; // keyed by questionId

  // Palette derived state
  palette: PaletteEntry[];

  // Save state
  saveState: SaveState;

  // Timer
  timer: TimerState;

  // Whether test is being submitted
  isSubmitting: boolean;
}

// ─── Backend Response Shapes ──────────────────────────────────────────────────

// Returned by POST /tests/:id/start
export interface StartAttemptResponse {
  attempt_id: string;
  test: {
    id: string;
    title: string;
    duration_minutes: number;
    total_marks: number;
    instructions: string;
  };
  questions: AttemptQuestion[];
  sections: {
    physics: number;
    chemistry: number;
    maths: number;
  };
  time_remaining_seconds: number;
  // Only present when resuming
  responses?: BackendResponse[];
}

export interface BackendResponse {
  question_id: string;
  selected_answer: string | null;
  status: string;
  time_spent_seconds: number;
}

// Returned by POST /tests/:id/save-response
export interface SaveResponsePayload {
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  status: string;
  time_spent_seconds?: number;
  time_remaining?: number;
}

// Returned by POST /tests/:id/submit
export interface SubmitAttemptPayload {
  attempt_id: string;
}

// ─── Test Metadata (for instructions page) ───────────────────────────────────

export interface TestMetadata {
  id: string;
  title: string;
  type: string;
  exam_type: string | null;
  duration_minutes: number;
  total_marks: number;
  instructions: string;
  scheduled_at: string | null;
  is_published: boolean;
  sections: {
    physics: number;
    chemistry: number;
    maths: number;
  };
  questions: AttemptQuestion[];
}

// Active attempt check result (used in instructions page)
export interface ActiveAttemptCheck {
  hasActiveAttempt: boolean;
  attemptId: string | null;
}
