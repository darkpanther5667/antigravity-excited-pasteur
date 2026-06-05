import { readFileSync, existsSync } from 'fs';

/**
 * Dry-run validation of a final/approved import file against
 * the production Question schema constraints.
 *
 * Returns a report of what WOULD be imported, how many, and any issues.
 */
export function dryRunImport(filePath) {
  if (!existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}` };
  }

  const raw = readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${e.message}` };
  }

  const questions = data.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return { success: false, error: 'No questions array found in import file' };
  }

  // Check each question against production schema constraints
  const issues = [];
  const valid = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qIssues = [];

    // Required fields
    if (!q.subject || !['PHYSICS', 'CHEMISTRY', 'MATHS'].includes(q.subject)) {
      qIssues.push('invalid or missing subject');
    }
    if (!q.examType || !['MAINS', 'ADVANCED'].includes(q.examType)) {
      qIssues.push('invalid or missing examType');
    }
    if (!q.type || !['SINGLE', 'MULTI', 'INTEGER', 'MATRIX'].includes(q.type)) {
      qIssues.push('invalid or missing type');
    }
    if (!q.difficulty || !['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) {
      qIssues.push('invalid or missing difficulty');
    }
    if (!q.questionText || q.questionText.length < 10) {
      qIssues.push('questionText too short or missing');
    }
    if (!q.correctAnswer) {
      qIssues.push('correctAnswer missing');
    }
    if (!q.chapter || q.chapter.length < 2) {
      qIssues.push('chapter missing or too short');
    }

    // Type-specific option checks
    if (['SINGLE', 'MULTI', 'MATRIX'].includes(q.type)) {
      if (!q.optionA) qIssues.push('SINGLE/MULTI/MATRIX: optionA required');
      if (!q.optionB) qIssues.push('SINGLE/MULTI/MATRIX: optionB required');
      if (!q.optionC) qIssues.push('SINGLE/MULTI/MATRIX: optionC required');
      if (!q.optionD) qIssues.push('SINGLE/MULTI/MATRIX: optionD required');
    }

    if (qIssues.length === 0) {
      valid.push({ index: i, question: q });
    } else {
      issues.push({ index: i, issues: qIssues, questionText: (q.questionText || '').substring(0, 80) });
    }
  }

  // Provenance summary from import file
  const provenanceSummary = {
    source: data.source || 'unknown',
    sources: [...new Set(questions.map(q => q.provenance?.sourceName || 'unknown').filter(Boolean))],
  };

  return {
    success: true,
    total: questions.length,
    validCount: valid.length,
    issueCount: issues.length,
    issues: issues.slice(0, 50), // cap display
    provenance: provenanceSummary,
    dryRun: true,
    ready: issues.length === 0,
    message: issues.length === 0
      ? `Ready to import ${valid.length} questions.`
      : `Found ${issues.length} question(s) with issues. Review before import.`,
  };
}

/**
 * Run the actual import into the database.
 * Requires a Prisma client instance.
 */
export async function runImport(filePath, prisma) {
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const questions = data.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    return { success: false, error: 'No questions to import' };
  }

  // Map to Prisma schema
  const prismaData = questions.map(q => ({
    subject: q.subject,
    chapter: q.chapter || 'General',
    topic: q.topic || 'General',
    difficulty: q.difficulty || 'MEDIUM',
    type: q.type || 'SINGLE',
    questionText: q.questionText,
    optionA: q.optionA || null,
    optionB: q.optionB || null,
    optionC: q.optionC || null,
    optionD: q.optionD || null,
    correctAnswer: q.correctAnswer,
    solution: q.solution || '',
    year: q.year || null,
    examType: q.examType || 'MAINS',
    ntaWeightage: q.ntaWeightage || 4,
    createdBy: q.createdBy || data.defaultCreatedBy || null,
  }));

  // Check for missing creator
  const missingCreator = prismaData.filter(d => !d.createdBy);
  if (missingCreator.length > 0) {
    return {
      success: false,
      error: `${missingCreator.length} questions missing createdBy. Set defaultCreatedBy in import file or use --creator-id flag.`,
    };
  }

  try {
    const result = await prisma.question.createMany({
      data: prismaData,
      skipDuplicates: false,
    });

    return {
      success: true,
      imported: result.count,
      total: prismaData.length,
    };
  } catch (err) {
    return {
      success: false,
      error: `Import failed: ${err.message}`,
    };
  }
}

export default { dryRunImport, runImport };
