import { createStagingRecord } from './staging-schema.js';

/**
 * Normalize extracted raw data into our staging schema.
 */
export function normalizeQuestion(raw, sourceInfo) {
  const record = createStagingRecord();

  // Apply source provenance
  if (sourceInfo) {
    record.source_type = sourceInfo.type || 'unknown';
    record.source_name = sourceInfo.name || null;
    record.source_url = sourceInfo.url || null;
    record.source_id = sourceInfo.id || null;
    record.source_year = sourceInfo.year || null;
    record.paper_label = sourceInfo.paperLabel || null;
    record.legal_confidence = sourceInfo.legalConfidence || 'medium';
  }

  // Map core fields from raw extraction
  if (raw.subject) record.subject = normalizeSubject(raw.subject);
  if (raw.chapter) record.chapter = raw.chapter.trim();
  if (raw.topic) record.topic = raw.topic.trim();
  if (raw.difficulty) record.difficulty = normalizeDifficulty(raw.difficulty);
  if (raw.type) record.type = normalizeType(raw.type);
  if (raw.question_text) record.question_text = raw.question_text.trim();
  if (raw.option_a) record.option_a = raw.option_a.trim();
  if (raw.option_b) record.option_b = raw.option_b.trim();
  if (raw.option_c) record.option_c = raw.option_c.trim();
  if (raw.option_d) record.option_d = raw.option_d.trim();
  if (raw.option_e) record.option_e = raw.option_e.trim();
  if (raw.correct_answer !== undefined && raw.correct_answer !== null) {
    record.correct_answer = String(raw.correct_answer).trim();
  }
  if (raw.solution) record.solution = raw.solution.trim();
  if (raw.year) record.year = parseInt(String(raw.year), 10);
  if (raw.exam_type) record.exam_type = normalizeExamType(raw.exam_type);
  if (raw.nta_weightage) record.nta_weightage = parseInt(String(raw.nta_weightage), 10);
  if (raw.question_number) record.question_number_in_source = parseInt(String(raw.question_number), 10);

  // Extraction metadata
  record.extraction_method = raw.extraction_method || 'manual';
  record.extraction_confidence = raw.extraction_confidence || 'low';
  record.raw_text_snippet = raw.question_text
    ? raw.question_text.substring(0, 200)
    : null;

  // Clear manual review flag for high-confidence extractions
  if (record.extraction_confidence === 'high') {
    record.manual_review_required = false;
  } else {
    record.manual_review_required = true;
    record.flag_reasons.push('low_extraction_confidence');
  }

  return record;
}

/**
 * Normalize subject strings to enum values.
 */
function normalizeSubject(val) {
  const s = String(val).toUpperCase().trim();
  if (s.startsWith('PHY')) return 'PHYSICS';
  if (s.startsWith('CHEM') || s.includes('CHEM')) return 'CHEMISTRY';
  if (s.startsWith('MATH')) return 'MATHS';
  return val; // pass through if unrecognized
}

/**
 * Normalize difficulty to enum values.
 */
function normalizeDifficulty(val) {
  const s = String(val).toUpperCase().trim();
  if (s === 'E' || s === 'EASY') return 'EASY';
  if (s === 'M' || s === 'MEDIUM' || s === 'MED') return 'MEDIUM';
  if (s === 'H' || s === 'HARD' || s === 'TOUGH') return 'HARD';
  return 'MEDIUM'; // default
}

/**
 * Normalize question type to enum values.
 */
function normalizeType(val) {
  const s = String(val).toUpperCase().trim();
  if (s === 'SINGLE' || s === 'MCQ' || s === 'SCQ') return 'SINGLE';
  if (s === 'MULTI' || s === 'MSQ' || s === 'MCQ_MULTI') return 'MULTI';
  if (s === 'INTEGER' || s === 'INT' || s === 'NUMERICAL' || s === 'NAT') return 'INTEGER';
  if (s === 'MATRIX' || s === 'MATCH') return 'MATRIX';
  return 'SINGLE'; // default
}

/**
 * Normalize exam type to enum values.
 */
function normalizeExamType(val) {
  const s = String(val).toUpperCase().trim();
  if (s === 'MAINS' || s === 'MAIN' || s === 'JEE_MAIN') return 'MAINS';
  if (s === 'ADVANCED' || s === 'ADV' || s === 'JEE_ADVANCED' || s === 'IIT') return 'ADVANCED';
  return 'MAINS'; // default
}

export default { normalizeQuestion };
