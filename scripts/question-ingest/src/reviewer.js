import { validateStagingBatch, detectDuplicates } from './validator.js';

/**
 * Run the full review pipeline on an array of staging records.
 * Returns a review report with:
 *  - summary statistics
 *  - per-record validation results
 *  - duplicate groups found
 *  - questions that need manual review
 *  - questions that are import-ready
 */
export function reviewBatch(records, options = {}) {
  const { autoAcceptHighConfidence = true } = options;

  // 1. Validate
  const validation = validateStagingBatch(records);

  // 2. Detect duplicates
  const duplicateGroupCount = detectDuplicates(records);

  // 3. Classify records into readiness tiers
  const importReady = [];
  const needsManualReview = [];
  const rejected = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const result = validation.results[i];

    const reasons = record.flag_reasons || [];
    const hasErrors = !result.valid;
    const isMarkedManual = record.manual_review_required === true;
    const hasDuplicates = !!record.duplicate_group_id;
    const isLowConfidence = record.extraction_confidence === 'low';
    const isLegalLow = record.legal_confidence === 'low';
    const hasMissingOptions = !record.option_a && ['SINGLE', 'MULTI', 'MATRIX'].includes(record.type);
    const noSubject = !record.subject;
    const noAnswer = !record.correct_answer;

    // Rejected: critical data missing
    if (noSubject || noAnswer || hasErrors) {
      rejected.push({
        index: i,
        record,
        reasons: result.errors,
        tier: 'rejected',
      });
      record.manual_review_required = true;
      record.review_notes = (record.review_notes || '') + '; REJECTED: ' + result.errors.join('; ');
      continue;
    }

    // Needs manual review: low confidence, duplicates, missing options, legal concerns
    if (isMarkedManual || isLowConfidence || isLegalLow || hasDuplicates || hasMissingOptions || result.warnings.length > 0) {
      const reviewReasons = [];
      if (isMarkedManual) reviewReasons.push('marked_manual_review');
      if (isLowConfidence) reviewReasons.push('low_extraction_confidence');
      if (isLegalLow) reviewReasons.push('low_legal_confidence');
      if (hasDuplicates) reviewReasons.push('potential_duplicate');
      if (hasMissingOptions) reviewReasons.push('missing_options');
      if (result.warnings.length > 0) reviewReasons.push(`warnings: ${result.warnings.length}`);

      needsManualReview.push({
        index: i,
        record,
        reasons: reviewReasons,
        warnings: result.warnings,
        tier: 'needs_review',
      });

      record.manual_review_required = true;
      record.review_notes = (record.review_notes || '') + '; Needs review: ' + reviewReasons.join(', ');
      continue;
    }

    // Import ready
    importReady.push({
      index: i,
      record,
      tier: 'import_ready',
    });
  }

  // Summary
  const summary = {
    total: records.length,
    importReady: importReady.length,
    needsManualReview: needsManualReview.length,
    rejected: rejected.length,
    duplicateGroups: duplicateGroupCount.length,
    validationErrors: validation.totalErrors,
    validationWarnings: validation.totalWarnings,
  };

  return {
    summary,
    tiers: {
      importReady,
      needsManualReview,
      rejected,
    },
    metadata: {
      reviewedAt: new Date().toISOString(),
      options,
    },
  };
}

/**
 * Print a human-readable review summary.
 */
export function printReviewSummary(review) {
  const { summary, tiers } = review;
  const lines = [];

  lines.push('='.repeat(60));
  lines.push('QUESTION INGESTION REVIEW REPORT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Total records:       ${summary.total}`);
  lines.push(`Import ready:        ${summary.importReady} ✅`);
  lines.push(`Needs manual review: ${summary.needsManualReview} ⚠️`);
  lines.push(`Rejected:            ${summary.rejected} ❌`);
  lines.push(`Duplicate groups:    ${summary.duplicateGroups}`);
  lines.push(`Validation errors:   ${summary.validationErrors}`);
  lines.push(`Validation warnings: ${summary.validationWarnings}`);
  lines.push('');

  if (tiers.rejected.length > 0) {
    lines.push('--- REJECTED ---');
    for (const r of tiers.rejected.slice(0, 10)) {
      lines.push(`  [${r.index}] ${r.reasons.join('; ')}`);
    }
    if (tiers.rejected.length > 10) {
      lines.push(`  ... and ${tiers.rejected.length - 10} more`);
    }
    lines.push('');
  }

  if (tiers.needsManualReview.length > 0) {
    lines.push('--- NEEDS MANUAL REVIEW ---');
    for (const r of tiers.needsManualReview.slice(0, 15)) {
      lines.push(`  [${r.index}] ${r.reasons.join(', ')}`);
      if (r.warnings.length > 0) {
        for (const w of r.warnings.slice(0, 3)) {
          lines.push(`          warning: ${w}`);
        }
      }
    }
    if (tiers.needsManualReview.length > 15) {
      lines.push(`  ... and ${tiers.needsManualReview.length - 15} more`);
    }
    lines.push('');
  }

  if (tiers.importReady.length > 0) {
    lines.push(`--- IMPORT READY (${tiers.importReady.length}) ---`);
    for (const r of tiers.importReady.slice(0, 5)) {
      lines.push(`  [${r.index}] ${r.record.subject} | ${r.record.chapter} | ${r.record.type}`);
    }
    if (tiers.importReady.length > 5) {
      lines.push(`  ... and ${tiers.importReady.length - 5} more`);
    }
    lines.push('');
  }

  lines.push('='.repeat(60));

  return lines.join('\n');
}

export default { reviewBatch, printReviewSummary };
