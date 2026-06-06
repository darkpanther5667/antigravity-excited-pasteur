#!/usr/bin/env node

/**
 * Clean up duplicate/synthetic questions and re-import PYQs cleanly.
 *
 * Steps:
 *   1. Delete ALL existing questions (hard delete or soft delete everything)
 *   2. Re-import PYQs from grafite and PW datasets
 *   3. Calculate test capacity
 *
 * Usage: node scripts/clean_and_reimport.js
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

const parseOptions = (s) => { try { return JSON.parse(s); } catch { return null; } };
const getCorrectOptionIndex = (s) => { try { const a = JSON.parse(s); return Array.isArray(a) && a.length > 0 ? a[0] : null; } catch { return null; } };

const mapSubject = (subj) => {
  const s = (subj || '').toLowerCase();
  if (s === 'physics' || s === 'physic') return 'PHYSICS';
  if (s === 'chemistry' || s === 'chem') return 'CHEMISTRY';
  if (s === 'maths' || s === 'math' || s === 'mathematics') return 'MATHS';
  return null;
};

// ─── batch insert ───────────────────────────────────────────────────────

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

// ─── import grafite ─────────────────────────────────────────────────────

async function importGrafite(createdBy) {
  const jsonlPath = path.join(__dirname, 'grafite_dataset.jsonl');
  console.log(`\n📖 Reading grafite: ${jsonlPath}`);

  const rl = createInterface({ input: createReadStream(jsonlPath, 'utf-8'), crlfDelay: Infinity });

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
      const correct = getCorrectOptionIndex(obj.correct_option);
      if (!correct) { skipped++; continue; }
      const optMap = {};
      for (const o of opts) optMap[o.identifier] = o.content || '';

      questions.push({
        subject: subj, chapter: obj.chapter || '', topic: obj.topic || '',
        difficulty, type: 'SINGLE',
        questionText: stripHtml(obj.question) || obj.question,
        optionA: stripHtml(optMap['A'] || ''), optionB: stripHtml(optMap['B'] || ''),
        optionC: stripHtml(optMap['C'] || ''), optionD: stripHtml(optMap['D'] || ''),
        correctAnswer: correct, solution: stripHtml(obj.explanation) || '',
        year, examType: 'MAINS', ntaWeightage: 4, createdBy,
      });
      singleCount++;
    } else {
      const answer = (obj.answer || '').trim();
      if (!answer) { skipped++; continue; }
      questions.push({
        subject: subj, chapter: obj.chapter || '', topic: obj.topic || '',
        difficulty, type: 'INTEGER',
        questionText: stripHtml(obj.question) || obj.question,
        optionA: null, optionB: null, optionC: null, optionD: null,
        correctAnswer: answer, solution: stripHtml(obj.explanation) || '',
        year, examType: 'MAINS', ntaWeightage: 4, createdBy,
      });
      integerCount++;
    }
    total++;

    if (questions.length >= BATCH_SIZE) {
      await insertBatch(questions);
      questions = [];
    }
  }
  if (questions.length > 0) await insertBatch(questions);

  console.log(`  ✅ ${total} grafite (${singleCount} SINGLE + ${integerCount} INTEGER, ${skipped} skipped)`);
  return total;
}

// ─── import PW Math ─────────────────────────────────────────────────────

async function importPWMath(createdBy) {
  let total = 0;
  for (const file of ['pw-math-jan.jsonl', 'pw-math-apr.jsonl']) {
    const filePath = path.join(__dirname, file);
    const rl = createInterface({ input: createReadStream(filePath, 'utf-8'), crlfDelay: Infinity });
    let questions = [];

    for await (const line of rl) {
      if (!line.trim()) continue;
      const obj = JSON.parse(line);
      const isInteger = obj.question_type === 0;

      let optA = '', optB = '', optC = '', optD = '', correctAnswer = '';

      if (isInteger) {
        correctAnswer = String(obj.answer ?? '');
      } else {
        const opts = obj.options || [];
        if (opts.length >= 1) optA = opts[0] || '';
        if (opts.length >= 2) optB = opts[1] || '';
        if (opts.length >= 3) optC = opts[2] || '';
        if (opts.length >= 4) optD = opts[3] || '';
        const correctIdx = (obj.correct_options || [])[0];
        if (correctIdx !== undefined && opts[correctIdx] !== undefined) {
          correctAnswer = String(['A','B','C','D'][correctIdx] || '');
        } else {
          correctAnswer = String(obj.answer ?? '');
        }
      }

      questions.push({
        subject: 'MATHS', chapter: 'Mathematics', topic: '',
        difficulty: 'HARD',
        type: isInteger ? 'INTEGER' : 'SINGLE',
        questionText: obj.question || '',
        optionA: optA, optionB: optB, optionC: optC, optionD: optD,
        correctAnswer, solution: '',
        year: 2025, examType: 'MAINS', ntaWeightage: 4, createdBy,
      });
      total++;

      if (questions.length >= BATCH_SIZE) {
        await insertBatch(questions);
        questions = [];
      }
    }
    if (questions.length > 0) await insertBatch(questions);
  }
  console.log(`  ✅ ${total} PW Math`);
  return total;
}

// ─── stats ──────────────────────────────────────────────────────────────

async function printStats() {
  const total = await prisma.question.count({ where: { deletedAt: null } });
  console.log(`\n📊 Total: ${total}`);
  for (const s of ['PHYSICS','CHEMISTRY','MATHS']) {
    const single = await prisma.question.count({ where: { subject: s, type: 'SINGLE', deletedAt: null } });
    const integer = await prisma.question.count({ where: { subject: s, type: 'INTEGER', deletedAt: null } });
    console.log(`   ${s}: ${single} SINGLE, ${integer} INTEGER`);
  }

  const sPhy = await prisma.question.count({ where: { deletedAt: null, subject: 'PHYSICS', type: 'SINGLE' } });
  const sChem = await prisma.question.count({ where: { deletedAt: null, subject: 'CHEMISTRY', type: 'SINGLE' } });
  const sMath = await prisma.question.count({ where: { deletedAt: null, subject: 'MATHS', type: 'SINGLE' } });
  const iPhy = await prisma.question.count({ where: { deletedAt: null, subject: 'PHYSICS', type: 'INTEGER' } });
  const iChem = await prisma.question.count({ where: { deletedAt: null, subject: 'CHEMISTRY', type: 'INTEGER' } });
  const iMath = await prisma.question.count({ where: { deletedAt: null, subject: 'MATHS', type: 'INTEGER' } });

  const fromSingle = Math.min(Math.floor(sPhy/20), Math.floor(sChem/20), Math.floor(sMath/20));
  const fromInteger = Math.min(Math.floor(iPhy/5), Math.floor(iChem/5), Math.floor(iMath/5));
  const maxTests = Math.min(fromSingle, fromInteger);

  console.log(`\n📋 Max tests: ${maxTests}`);
  console.log(`   SINGLE: min(${sPhy}/20, ${sChem}/20, ${sMath}/20) = ${fromSingle}`);
  console.log(`   INTEGER: min(${iPhy}/5, ${iChem}/5, ${iMath}/5) = ${fromInteger}`);
  return maxTests;
}

// ─── main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Finding admin user...');
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) admin = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!admin) admin = await prisma.user.findFirst();
  if (!admin) { console.error('❌ No user.'); process.exit(1); }
  console.log(`👤 ${admin.id} — ${admin.name || admin.email}`);

  // ── Step 1: Nuke everything ──
  console.log('\n═══════════════════════════════════════');
  console.log('  STEP 1: Purging all existing data');
  console.log('═══════════════════════════════════════');

  // Truncate all tables in one shot
  await prisma.$executeRawUnsafe('TRUNCATE TABLE responses, attempts, test_questions, tests, questions CASCADE');
  console.log('   🗑️  Truncated all question/test/attempt/response tables');

  // ── Step 2: Import PYQs ──
  console.log('\n═══════════════════════════════════════');
  console.log('  STEP 2: Importing PYQs');
  console.log('═══════════════════════════════════════');

  const gCount = await importGrafite(admin.id);
  const pCount = await importPWMath(admin.id);
  console.log(`\n📥 Total imported: ${gCount + pCount}`);

  const maxTests = await printStats();

  // ── Step 3: Test creation tip ──
  console.log('\n═══════════════════════════════════════');
  console.log('  DONE');
  console.log('═══════════════════════════════════════');
  console.log(`\n   Run this to create tests:`);
  console.log(`   cd backend && node scripts/createTests.js ${maxTests}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌', err);
  prisma.$disconnect();
  process.exit(1);
});
