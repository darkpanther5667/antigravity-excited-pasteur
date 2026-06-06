#!/usr/bin/env node

/**
 * PYQ Importer — replaces synthetic questions with real JEE Main PYQs
 *
 * Sources:
 *   1. ruh-ai/grafite-jee-mains-qna-no-img  (11,396 MCQs, 2002-2024)
 *   2. PhysicsWallahAI/JEE-Main-2025-Math    (475 math questions, 2025)
 *
 * Usage: node scripts/importPyqs.js
 * Run from backend/ directory with DATABASE_URL set.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const BATCH_SIZE = 500;

// ─── helpers ────────────────────────────────────────────────────────────

const extractYear = (paperId) => {
  if (!paperId) return null;
  const m = paperId.match(/(\d{4})/);
  return m ? parseInt(m[1]) : null;
};

const getDifficulty = (year) => {
  if (!year) return 'MEDIUM';
  if (year <= 2012) return 'EASY';
  if (year <= 2019) return 'MEDIUM';
  return 'HARD';
};

/** Strip HTML tags but keep <sub>/<sup> for math expressions */
const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<sub>/gi, '_')
    .replace(/<\/sub>/gi, '')
    .replace(/<sup>/gi, '^')
    .replace(/<\/sup>/gi, '')
    .replace(/<img[^>]*>/gi, '[image]')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const parseOptions = (optionsJson) => {
  try {
    return JSON.parse(optionsJson);
  } catch {
    return null;
  }
};

const getCorrectOptionIndex = (correctOptionJson) => {
  try {
    const arr = JSON.parse(correctOptionJson);
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
    return null;
  } catch {
    return null;
  }
};

const mapSubject = (subj) => {
  const s = (subj || '').toLowerCase();
  if (s === 'physics' || s === 'physic') return 'PHYSICS';
  if (s === 'chemistry' || s === 'chem') return 'CHEMISTRY';
  if (s === 'maths' || s === 'math' || s === 'mathematics') return 'MATHS';
  return null;
};

// ─── import from grafite CSV ────────────────────────────────────────────

async function importGrafite(createdBy) {
  const jsonlPath = path.join(__dirname, 'grafite_dataset.jsonl');
  console.log(`\n📖 Reading grafite JSONL: ${jsonlPath}`);

  const fileStream = createReadStream(jsonlPath, { encoding: 'utf-8' });
  const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

  let questions = [];
  let total = 0;
  let skipped = 0;
  let singleCount = 0;
  let integerCount = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;

    let obj;
    try { obj = JSON.parse(line); } catch { skipped++; continue; }

    const subj = mapSubject(obj.subject);
    if (!subj) { skipped++; continue; }

    const year = extractYear(obj.paper_id);
    const difficulty = getDifficulty(year);
    const opts = parseOptions(obj.options);
    const hasOptions = opts && Array.isArray(opts) && opts.length >= 2;

    if (hasOptions) {
      // ── MCQ / SINGLE type ──
      const correct = getCorrectOptionIndex(obj.correct_option);
      if (!correct) { skipped++; continue; }

      const optMap = {};
      for (const o of opts) {
        optMap[o.identifier] = o.content || '';
      }

      questions.push({
        subject: subj,
        chapter: obj.chapter || '',
        topic: obj.topic || '',
        difficulty,
        type: 'SINGLE',
        questionText: stripHtml(obj.question) || obj.question,
        optionA: stripHtml(optMap['A'] || ''),
        optionB: stripHtml(optMap['B'] || ''),
        optionC: stripHtml(optMap['C'] || ''),
        optionD: stripHtml(optMap['D'] || ''),
        correctAnswer: correct,
        solution: stripHtml(obj.explanation) || '',
        year,
        examType: 'MAINS',
        ntaWeightage: 4,
        createdBy,
      });
      singleCount++;
    } else {
      // ── Numerical / INTEGER type ──
      const answer = (obj.answer || '').trim();
      if (!answer) { skipped++; continue; }

      questions.push({
        subject: subj,
        chapter: obj.chapter || '',
        topic: obj.topic || '',
        difficulty,
        type: 'INTEGER',
        questionText: stripHtml(obj.question) || obj.question,
        optionA: null,
        optionB: null,
        optionC: null,
        optionD: null,
        correctAnswer: answer,
        solution: stripHtml(obj.explanation) || '',
        year,
        examType: 'MAINS',
        ntaWeightage: 4,
        createdBy,
      });
      integerCount++;
    }
    total++;

    if (questions.length >= BATCH_SIZE) {
      await insertBatch(questions);
      questions = [];
      process.stdout.write(`\r  ✅ Imported ${total} grafite questions...`);
    }
  }

  if (questions.length > 0) {
    await insertBatch(questions);
  }

  process.stdout.write(`\r  ✅ Imported ${total} grafite questions (${singleCount} SINGLE + ${integerCount} INTEGER, ${skipped} skipped)\n`);
  return total;
}

// ─── import from PhysicsWallahAI JSONL ──────────────────────────────────

async function importPWMath(createdBy) {
  let total = 0;
  let skipped = 0;

  for (const file of ['pw-math-jan.jsonl', 'pw-math-apr.jsonl']) {
    const filePath = path.join(__dirname, file);
    console.log(`\n📖 Reading ${file}`);
    const fileStream = createReadStream(filePath, { encoding: 'utf-8' });
    const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

    let questions = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      let obj;
      try { obj = JSON.parse(line); } catch { skipped++; continue; }

      const qType = obj.question_type;
      const isInteger = qType === 0;

      let optA = '', optB = '', optC = '', optD = '';
      let correctAnswer = '';

      if (isInteger) {
        // Integer type — answer is the number itself
        correctAnswer = String(obj.answer ?? '');
      } else {
        // MCQ — has options array and correct_options index
        const opts = obj.options || [];
        if (opts.length >= 1) optA = opts[0] || '';
        if (opts.length >= 2) optB = opts[1] || '';
        if (opts.length >= 3) optC = opts[2] || '';
        if (opts.length >= 4) optD = opts[3] || '';

        const correctIdx = (obj.correct_options || [])[0];
        if (correctIdx !== undefined && opts[correctIdx] !== undefined) {
          correctAnswer = String(['A','B','C','D'][correctIdx] || '');
        } else {
          // Fallback: store answer value
          correctAnswer = String(obj.answer ?? '');
        }
      }

      const q = {
        subject: 'MATHS',
        chapter: 'Mathematics',
        topic: '',
        difficulty: 'HARD',
        type: isInteger ? 'INTEGER' : 'SINGLE',
        questionText: obj.question || '',
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer,
        solution: '',
        year: 2025,
        examType: 'MAINS',
        ntaWeightage: 4,
        createdBy,
      };
      questions.push(q);
      total++;

      if (questions.length >= BATCH_SIZE) {
        await insertBatch(questions);
        questions = [];
      }
    }

    if (questions.length > 0) {
      await insertBatch(questions);
    }
  }

  console.log(`  ✅ Imported ${total} PW Math questions (${skipped} skipped)`);
  return { total, skipped };
}

// ─── batch insert using Prisma createMany ───────────────────────────────

async function insertBatch(questions) {
  await prisma.question.createMany({
    data: questions.map(q => ({
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic || '',
      difficulty: q.difficulty,
      type: q.type,
      questionText: q.questionText,
      optionA: q.optionA || null,
      optionB: q.optionB || null,
      optionC: q.optionC || null,
      optionD: q.optionD || null,
      correctAnswer: q.correctAnswer,
      solution: q.solution || '',
      year: q.year || null,
      examType: q.examType,
      ntaWeightage: q.ntaWeightage,
      createdBy: q.createdBy,
    })),
  });
}


// ─── count questions by subject/type ────────────────────────────────────

async function printStats() {
  const total = await prisma.question.count({ where: { deletedAt: null } });
  console.log(`\n📊 Total questions: ${total}`);

  for (const subject of ['PHYSICS', 'CHEMISTRY', 'MATHS']) {
    const single = await prisma.question.count({ where: { subject, type: 'SINGLE', deletedAt: null } });
    const integer = await prisma.question.count({ where: { subject, type: 'INTEGER', deletedAt: null } });
    console.log(`   ${subject}: ${single} SINGLE, ${integer} INTEGER`);
  }
}

// ─── main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Checking admin user...');
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) admin = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!admin) admin = await prisma.user.findFirst();
  if (!admin) { console.error('❌ No user found.'); process.exit(1); }

  console.log(`👤 Using creator: ${admin.id} ${admin.name || admin.email}`);

  // ── Step 1: Import grafite PYQs ──
  console.log('\n═══════════════════════════════════════');
  console.log('  STEP 1: Importing Grafite PYQs');
  console.log('═══════════════════════════════════════');
  const grafiteCount = await importGrafite(admin.id);

  // ── Step 2: Import PW Math 2025 ──
  console.log('\n═══════════════════════════════════════');
  console.log('  STEP 2: Importing PW Math 2025');
  console.log('═══════════════════════════════════════');
  const pwResult = await importPWMath(admin.id);

  await printStats();

  // ── Step 3: Ask about deleting synthetic questions ──
  console.log('\n═══════════════════════════════════════');
  console.log('  STEP 3: Ready to delete old synthetic questions');
  console.log('═══════════════════════════════════════');
  console.log('');
  console.log('⚠️  To delete all old synthetic questions (created by generateQuestions.js),');
  console.log('   set DELETE_OLD=true in your environment and re-run.');
  console.log('');
  console.log('   Example: DELETE_OLD=true node scripts/importPyqs.js');
  console.log('');
  console.log('   This will soft-delete all questions not imported by this script.');

  if (process.env.DELETE_OLD === 'true') {
    console.log('\n🗑️  DELETE_OLD is set. Purging old data...');

    // Step A: Delete all existing tests (cascades to test_questions)
    const testCount = await prisma.test.count({ where: { deletedAt: null } });
    if (testCount > 0) {
      await prisma.test.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() }
      });
      console.log(`   🗑️  Soft-deleted ${testCount} existing tests`);
    }

    // Step B: Permanently delete orphaned test_question records
    // (cascade handles this when tests are deleted, but we soft-deleted, so do it manually)
    const tqCount = await prisma.testQuestion.deleteMany({
      where: { test: { deletedAt: { not: null } } }
    });
    if (tqCount.count > 0) {
      console.log(`   🗑️  Removed ${tqCount.count} orphaned test-question links`);
    }

    // Step C: Soft-delete old synthetic questions (those without year set)
    const currentTotal = await prisma.question.count({ where: { deletedAt: null } });
    console.log(`   Current active questions: ${currentTotal}`);

    const pyqCount = await prisma.question.count({
      where: { deletedAt: null, year: { not: null } }
    });
    console.log(`   PYQ questions (year set, keeping): ${pyqCount}`);

    const deleteResult = await prisma.question.updateMany({
      where: { deletedAt: null, year: null },
      data: { deletedAt: new Date() }
    });
    console.log(`   🗑️  Soft-deleted ${deleteResult.count} synthetic questions`);

    await printStats();

    // Show test creation capacity
    console.log('\n📋 Test creation capacity (with PYQs only):');
    const singlePhy = await prisma.question.count({ where: { deletedAt: null, subject: 'PHYSICS', type: 'SINGLE' } });
    const singleChem = await prisma.question.count({ where: { deletedAt: null, subject: 'CHEMISTRY', type: 'SINGLE' } });
    const singleMath = await prisma.question.count({ where: { deletedAt: null, subject: 'MATHS', type: 'SINGLE' } });
    const intPhy = await prisma.question.count({ where: { deletedAt: null, subject: 'PHYSICS', type: 'INTEGER' } });
    const intChem = await prisma.question.count({ where: { deletedAt: null, subject: 'CHEMISTRY', type: 'INTEGER' } });
    const intMath = await prisma.question.count({ where: { deletedAt: null, subject: 'MATHS', type: 'INTEGER' } });

    const fromSingle = Math.min(Math.floor(singlePhy/20), Math.floor(singleChem/20), Math.floor(singleMath/20));
    const fromInteger = Math.min(Math.floor(intPhy/5), Math.floor(intChem/5), Math.floor(intMath/5));
    const maxTests = Math.min(fromSingle, fromInteger);

    console.log(`   From SINGLE: min(${singlePhy}/20, ${singleChem}/20, ${singleMath}/20) = ${fromSingle}`);
    console.log(`   From INTEGER: min(${intPhy}/5, ${intChem}/5, ${intMath}/5) = ${fromInteger}`);
    console.log(`   Max possible tests: ${maxTests}`);
    console.log('');
    console.log(`   Run: node scripts/createTests.js ${maxTests}`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
