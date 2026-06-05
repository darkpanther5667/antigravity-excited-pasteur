import type {
  AttemptQuestion,
  SectionName,
  SectionState,
  ResponseStatus,
  AnswerDraft,
  PaletteEntry,
  BackendResponse,
} from './types/attempt';

// ─── Section Grouping ─────────────────────────────────────────────────────────

const SECTION_ORDER: SectionName[] = ['PHYSICS', 'CHEMISTRY', 'MATHS'];

/**
 * Groups a flat list of questions into ordered sections.
 * Only creates sections that have at least one question.
 */
export function groupIntoSections(
  questions: AttemptQuestion[],
): SectionState[] {
  const grouped: Record<SectionName, AttemptQuestion[]> = {
    PHYSICS: [],
    CHEMISTRY: [],
    MATHS: [],
  };

  for (const q of questions) {
    if (grouped[q.subject]) {
      grouped[q.subject].push(q);
    }
  }

  return SECTION_ORDER.filter((s) => grouped[s].length > 0).map((name) => ({
    name,
    questions: grouped[name],
    counts: emptyCounts(),
  }));
}

function emptyCounts() {
  return {
    notVisited: 0,
    visited: 0,
    answered: 0,
    marked: 0,
    answeredMarked: 0,
  };
}

// ─── Hydrate Answers from Backend Responses ───────────────────────────────────

/**
 * Converts backend saved responses into the frontend AnswerDraft map.
 * Questions with no backend response are initialized as NOT_VISITED.
 */
export function hydrateAnswers(
  questions: AttemptQuestion[],
  backendResponses: BackendResponse[] = [],
): Record<string, AnswerDraft> {
  const responseMap = new Map<string, BackendResponse>();
  for (const r of backendResponses) {
    responseMap.set(r.question_id, r);
  }

  const answers: Record<string, AnswerDraft> = {};

  for (const q of questions) {
    const saved = responseMap.get(q.id);
    if (saved) {
      answers[q.id] = {
        questionId: q.id,
        selectedAnswer: saved.selected_answer ?? null,
        status: normalizeBackendStatus(saved.status),
      };
    } else {
      answers[q.id] = {
        questionId: q.id,
        selectedAnswer: null,
        status: 'NOT_VISITED',
      };
    }
  }

  return answers;
}

/**
 * Maps backend status string to frontend ResponseStatus.
 * Backend stores: ANSWERED, MARKED_FOR_REVIEW, ANSWERED_MARKED, VISITED, NOT_VISITED
 */
function normalizeBackendStatus(backendStatus: string): ResponseStatus {
  switch (backendStatus) {
    case 'ANSWERED':
      return 'ANSWERED';
    case 'MARKED_FOR_REVIEW':
      return 'MARKED';
    case 'ANSWERED_MARKED':
      return 'ANSWERED_MARKED';
    case 'VISITED':
      return 'VISITED';
    default:
      return 'NOT_VISITED';
  }
}

/**
 * Maps frontend ResponseStatus to backend-expected status string.
 */
export function toBackendStatus(status: ResponseStatus): string {
  switch (status) {
    case 'ANSWERED':
      return 'ANSWERED';
    case 'MARKED':
      return 'MARKED_FOR_REVIEW';
    case 'ANSWERED_MARKED':
      return 'ANSWERED_MARKED';
    case 'VISITED':
      return 'VISITED';
    case 'NOT_VISITED':
      return 'NOT_VISITED';
  }
}

// ─── Palette Derivation ────────────────────────────────────────────────────────

/**
 * Derives a flat palette from sections + answers.
 * Global index = position in allQuestions array.
 */
export function derivePalette(
  sections: SectionState[],
  answers: Record<string, AnswerDraft>,
): PaletteEntry[] {
  const palette: PaletteEntry[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    section.questions.forEach((q, sectionIdx) => {
      const draft = answers[q.id];
      palette.push({
        questionId: q.id,
        questionIndex: globalIndex,
        sectionIndex: sectionIdx,
        section: section.name,
        status: draft?.status ?? 'NOT_VISITED',
      });
      globalIndex++;
    });
  }

  return palette;
}

// ─── Section Count Derivation ─────────────────────────────────────────────────

export function deriveSectionCounts(
  sections: SectionState[],
  answers: Record<string, AnswerDraft>,
): SectionState[] {
  return sections.map((section) => {
    const counts = emptyCounts();
    for (const q of section.questions) {
      const status = answers[q.id]?.status ?? 'NOT_VISITED';
      switch (status) {
        case 'NOT_VISITED':
          counts.notVisited++;
          break;
        case 'VISITED':
          counts.visited++;
          break;
        case 'ANSWERED':
          counts.answered++;
          break;
        case 'MARKED':
          counts.marked++;
          break;
        case 'ANSWERED_MARKED':
          counts.answeredMarked++;
          break;
      }
    }
    return { ...section, counts };
  });
}

// ─── Global Status Aggregates ─────────────────────────────────────────────────

export interface GlobalCounts {
  total: number;
  answered: number;
  unanswered: number;
  markedForReview: number;
  answeredAndMarked: number;
  notVisited: number;
  visited: number;
}

export function deriveGlobalCounts(
  allQuestions: AttemptQuestion[],
  answers: Record<string, AnswerDraft>,
): GlobalCounts {
  let answered = 0;
  let markedForReview = 0;
  let answeredAndMarked = 0;
  let notVisited = 0;
  let visited = 0;

  for (const q of allQuestions) {
    const status = answers[q.id]?.status ?? 'NOT_VISITED';
    switch (status) {
      case 'ANSWERED':
        answered++;
        break;
      case 'MARKED':
        markedForReview++;
        break;
      case 'ANSWERED_MARKED':
        answeredAndMarked++;
        break;
      case 'NOT_VISITED':
        notVisited++;
        break;
      case 'VISITED':
        visited++;
        break;
    }
  }

  const total = allQuestions.length;
  const unanswered = notVisited + visited + markedForReview;

  return {
    total,
    answered,
    unanswered,
    markedForReview,
    answeredAndMarked,
    notVisited,
    visited,
  };
}

// ─── Determine new status after user interaction ───────────────────────────────

/**
 * Compute the new status for a question after the user performs an action.
 *
 * Rules:
 * - save: has answer → ANSWERED, no answer → VISITED
 * - markReview: has answer → ANSWERED_MARKED, no answer → MARKED
 * - clear: → VISITED (they've been to the question)
 */
export function computeNewStatus(
  action: 'save' | 'markReview' | 'clear',
  hasAnswer: boolean,
): ResponseStatus {
  switch (action) {
    case 'save':
      return hasAnswer ? 'ANSWERED' : 'VISITED';
    case 'markReview':
      return hasAnswer ? 'ANSWERED_MARKED' : 'MARKED';
    case 'clear':
      return 'VISITED';
  }
}

// ─── Flatten allQuestions ─────────────────────────────────────────────────────

export function flattenQuestions(sections: SectionState[]): AttemptQuestion[] {
  return sections.flatMap((s) => s.questions);
}

// ─── Find global index ────────────────────────────────────────────────────────

export function findGlobalIndex(
  allQuestions: AttemptQuestion[],
  questionId: string,
): number {
  return allQuestions.findIndex((q) => q.id === questionId);
}

// ─── Find first question in section ──────────────────────────────────────────

export function findFirstQuestionIndexInSection(
  allQuestions: AttemptQuestion[],
  section: SectionName,
): number {
  return allQuestions.findIndex((q) => q.subject === section);
}

// ─── Format timer display ─────────────────────────────────────────────────────

export function formatTimer(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
