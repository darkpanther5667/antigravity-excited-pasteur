import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Export an array of staging records to a JSON review artifact.
 */
export function exportToJson(records, outputPath, metadata = {}) {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const exportObj = {
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    metadata,
    records,
  };

  writeFileSync(outputPath, JSON.stringify(exportObj, null, 2), 'utf-8');
  return outputPath;
}

/**
 * Export an array of staging records to a CSV review artifact.
 */
export function exportToCsv(records, outputPath) {
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const headers = [
    'subject', 'chapter', 'topic', 'difficulty', 'type',
    'question_text', 'option_a', 'option_b', 'option_c', 'option_d',
    'correct_answer', 'solution', 'year', 'exam_type',
    'source_id', 'source_name', 'source_url',
    'extraction_confidence', 'legal_confidence',
    'manual_review_required', 'review_notes', 'flag_reasons',
  ];

  const lines = [headers.join(',')];

  for (const r of records) {
    const row = headers.map(h => {
      let val = r[h] !== undefined && r[h] !== null ? String(r[h]) : '';
      // Escape CSV values
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    });
    lines.push(row.join(','));
  }

  writeFileSync(outputPath, '﻿' + lines.join('\n'), 'utf-8');
  return outputPath;
}

/**
 * Export the review report to a text file.
 */
export function exportReviewReport(review, outputPath) {
  // Inline a minimal summary since we avoid circular imports
  const lines = [];
  const { summary, tiers } = review;

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

  const content = lines.join('\n');

  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, content, 'utf-8');
  return outputPath;
}

/**
 * Export import-ready records in production-compatible format.
 */
export function exportImportReady(records, outputPath, metadata = {}) {
  const importData = {
    exportedAt: new Date().toISOString(),
    source: 'jeemocks-ingestion-pipeline',
    recordCount: records.length,
    metadata,
    questions: records.map(r => ({
      subject: r.subject,
      chapter: r.chapter || 'General',
      topic: r.topic || 'General',
      difficulty: r.difficulty || 'MEDIUM',
      type: r.type || 'SINGLE',
      questionText: r.question_text,
      optionA: r.option_a,
      optionB: r.option_b,
      optionC: r.option_c,
      optionD: r.option_d,
      correctAnswer: r.correct_answer,
      solution: r.solution || '',
      year: r.year || null,
      examType: r.exam_type || 'MAINS',
      ntaWeightage: r.nta_weightage || 4,
      // Provenance carried in metadata field for traceability
      provenance: {
        sourceId: r.source_id,
        sourceName: r.source_name,
        sourceUrl: r.source_url,
        sourceYear: r.source_year,
        extractionConfidence: r.extraction_confidence,
        legalConfidence: r.legal_confidence,
      },
    })),
  };

  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(importData, null, 2), 'utf-8');
  return outputPath;
}

export default { exportToJson, exportToCsv, exportImportReady };
