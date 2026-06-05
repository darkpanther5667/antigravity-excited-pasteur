/**
 * StagingQuestion schema — the normalized intermediate format for every
 * extracted question record before it reaches the review step.
 *
 * This preserves full provenance and is designed for manual review before
 * mapping to the production Question model.
 *
 * Field naming matches the production schema conventions (snake_case for
 * staging, camelCase mapped at import time).
 */

export const STAGING_FIELDS = [
  // --- Core question data (maps to production Question model) ---
  'subject',
  'chapter',
  'topic',
  'difficulty',
  'type',
  'question_text',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'option_e',
  'correct_answer',
  'solution',
  'year',
  'exam_type',
  'nta_weightage',

  // --- Provenance (NOT in production model — preserved in review export) ---
  'source_type',
  'source_name',
  'source_url',
  'source_id',
  'source_year',
  'paper_label',
  'question_number_in_source',

  // --- Extraction metadata ---
  'extraction_method',
  'extraction_date',
  'extraction_confidence',       // 'high' | 'medium' | 'low'
  'legal_confidence',            // 'high' | 'medium' | 'low'
  'raw_text_snippet',

  // --- Review flags ---
  'manual_review_required',      // boolean
  'review_notes',
  'flag_reasons',                // string[]
  'duplicate_group_id',
];

/**
 * Returns a fresh staging question template.
 */
export function createStagingRecord() {
  return {
    subject: null,
    chapter: null,
    topic: null,
    difficulty: null,
    type: null,
    question_text: null,
    option_a: null,
    option_b: null,
    option_c: null,
    option_d: null,
    option_e: null,
    correct_answer: null,
    solution: null,
    year: null,
    exam_type: null,
    nta_weightage: 4,

    source_type: null,
    source_name: null,
    source_url: null,
    source_id: null,
    source_year: null,
    paper_label: null,
    question_number_in_source: null,

    extraction_method: null,
    extraction_date: new Date().toISOString(),
    extraction_confidence: 'low',
    legal_confidence: 'high',

    raw_text_snippet: null,
    manual_review_required: true,
    review_notes: null,
    flag_reasons: [],
    duplicate_group_id: null,
  };
}

/**
 * Map a staging record to production-ready format.
 * Strips provenance fields and maps to Prisma field names.
 */
export function stagingToProduction(staging) {
  return {
    subject: staging.subject,
    chapter: staging.chapter,
    topic: staging.topic,
    difficulty: staging.difficulty,
    type: staging.type,
    questionText: staging.question_text,
    optionA: staging.option_a,
    optionB: staging.option_b,
    optionC: staging.option_c,
    optionD: staging.option_d,
    correctAnswer: staging.correct_answer,
    solution: staging.solution,
    year: staging.year || null,
    examType: staging.exam_type,
    ntaWeightage: staging.nta_weightage || 4,
  };
}

/**
 * CSV header row for review export.
 */
export const STAGING_CSV_HEADERS = STAGING_FIELDS.join(',');
