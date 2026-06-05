import { STAGING_FIELDS, createStagingRecord } from './staging-schema.js';

const VALID_SUBJECTS = ['PHYSICS', 'CHEMISTRY', 'MATHS'];
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const VALID_TYPES = ['SINGLE', 'MULTI', 'INTEGER', 'MATRIX'];
const VALID_EXAM_TYPES = ['MAINS', 'ADVANCED'];

/**
 * Validate a single staging record.
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export function validateStagingRecord(record, index) {
  const errors = [];
  const warnings = [];

  // --- Required fields ---

  if (!record.subject) {
    errors.push(`[Q${index}] subject is missing`);
  } else if (!VALID_SUBJECTS.includes(record.subject)) {
    errors.push(`[Q${index}] subject "${record.subject}" is not valid (must be PHYSICS, CHEMISTRY, MATHS)`);
  }

  if (!record.question_text || record.question_text.length < 5) {
    errors.push(`[Q${index}] question_text is missing or too short`);
  }

  if (!record.correct_answer || record.correct_answer.length === 0) {
    errors.push(`[Q${index}] correct_answer is missing`);
  }

  if (!record.exam_type) {
    errors.push(`[Q${index}] exam_type is missing`);
  } else if (!VALID_EXAM_TYPES.includes(record.exam_type)) {
    warnings.push(`[Q${index}] exam_type "${record.exam_type}" is unusual`);
  }

  // --- Type-specific validation ---

  if (record.type && VALID_TYPES.includes(record.type)) {
    if (record.type === 'SINGLE') {
      if (!record.option_a || !record.option_b || !record.option_c || !record.option_d) {
        errors.push(`[Q${index}] SINGLE type requires all 4 options (a-d)`);
      }
      if (record.correct_answer && !['a', 'b', 'c', 'd'].includes(record.correct_answer)) {
        errors.push(`[Q${index}] SINGLE correct_answer must be a/b/c/d, got "${record.correct_answer}"`);
      }
    }

    if (record.type === 'MULTI') {
      if (!record.option_a || !record.option_b || !record.option_c || !record.option_d) {
        errors.push(`[Q${index}] MULTI type requires all 4 options (a-d)`);
      }
      if (record.correct_answer) {
        const parts = record.correct_answer.split(',').map(p => p.trim());
        const invalid = parts.filter(p => !['a', 'b', 'c', 'd'].includes(p));
        if (invalid.length > 0) {
          errors.push(`[Q${index}] MULTI correct_answer contains invalid keys: ${invalid.join(',')}`);
        }
      }
    }

    if (record.type === 'INTEGER') {
      if (record.option_a || record.option_b || record.option_c || record.option_d) {
        warnings.push(`[Q${index}] INTEGER type should not have options (will be ignored)`);
      }
      if (record.correct_answer && isNaN(Number(record.correct_answer))) {
        errors.push(`[Q${index}] INTEGER correct_answer must be numeric, got "${record.correct_answer}"`);
      }
    }

    if (record.type === 'MATRIX') {
      if (!record.option_a || !record.option_b || !record.option_c || !record.option_d) {
        warnings.push(`[Q${index}] MATRIX type typically has 4+ options`);
      }
    }
  } else {
    warnings.push(`[Q${index}] type "${record.type}" is not standard, may need mapping`);
  }

  // --- Difficulty ---

  if (record.difficulty && !VALID_DIFFICULTIES.includes(record.difficulty)) {
    warnings.push(`[Q${index}] difficulty "${record.difficulty}" is not standard`);
  }

  // --- LaTeX sanity check ---

  if (record.question_text) {
    const openDollar = (record.question_text.match(/\$/g) || []).length;
    if (openDollar > 0 && openDollar % 2 !== 0) {
      warnings.push(`[Q${index}] question_text has unpaired $ — possible malformed LaTeX`);
    }
    // Check for common broken LaTeX patterns
    const brokenLatexPatterns = ['\\\\[a-zA-Z]', '\\\\begin{', '\\\\end{'];
    for (const pat of brokenLatexPatterns) {
      if (new RegExp(pat).test(record.question_text)) {
        warnings.push(`[Q${index}] question_text may have partial/raw LaTeX commands`);
        break;
      }
    }
  }

  // --- Provenance ---

  if (!record.source_url || !record.source_id) {
    warnings.push(`[Q${index}] missing provenance information (source_url or source_id)`);
  }

  // --- Review flag inheritance ---

  if (record.manual_review_required) {
    warnings.push(`[Q${index}] marked for manual review: ${record.review_notes || 'unspecified'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Batch validate an array of staging records.
 * Returns summary with per-record results.
 */
export function validateStagingBatch(records) {
  const results = records.map((r, i) => ({
    index: i,
    ...validateStagingRecord(r, i),
  }));

  const valid = results.filter(r => r.valid);
  const invalid = results.filter(r => !r.valid);

  return {
    total: records.length,
    validCount: valid.length,
    invalidCount: invalid.length,
    totalErrors: invalid.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    results,
  };
}

/**
 * Detect potential duplicates within a batch.
 * Uses question_text similarity (first 100 chars) as a heuristic.
 */
export function detectDuplicates(records) {
  const groups = [];
  const seen = new Map();

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r.question_text) continue;

    const fingerprint = r.question_text.substring(0, 100).replace(/\s+/g, ' ').trim().toLowerCase();
    const existing = seen.get(fingerprint);

    if (existing !== undefined) {
      groups.push({ group: `${existing}-${i}`, indices: [existing, i] });
      records[i].duplicate_group_id = `${existing}-${i}`;
      records[existing].duplicate_group_id = `${existing}-${i}`;
      records[i].flag_reasons.push('potential_duplicate');
      records[existing].flag_reasons.push('potential_duplicate');
    } else {
      seen.set(fingerprint, i);
    }
  }

  return groups;
}

export default { validateStagingRecord, validateStagingBatch, detectDuplicates };
