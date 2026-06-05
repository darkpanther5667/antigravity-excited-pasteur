#!/usr/bin/env node

/**
 * Execute actual DB import from a final/approved import-ready JSON file.
 *
 * Usage:
 *   node execute-import.js <file-path> [creator-user-id]
 *
 * This script must be run from the backend directory (where @prisma/client is available).
 *
 * Example:
 *   cd backend && node ../scripts/question-ingest/src/execute-import.js \
 *     ../data/final/sample-approved-import-ready.json dev-teacher-id
 */

import { readFileSync, existsSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const creatorId = args[1];

  if (!filePath || !existsSync(filePath)) {
    console.error('❌ Usage: node execute-import.js <file-path> [creator-user-id]');
    console.error('   File must be an import-ready JSON from the ingestion pipeline.');
    process.exit(1);
  }

  const raw = readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ Invalid JSON: ${e.message}`);
    process.exit(1);
  }

  const questions = data.questions;
  if (!Array.isArray(questions) || questions.length === 0) {
    console.error('❌ No questions array found in import file.');
    process.exit(1);
  }

  // Resolve creator
  let effectiveCreatorId = creatorId;

  // If no creator flag, check the file itself
  if (!effectiveCreatorId) {
    effectiveCreatorId = data.defaultCreatedBy || null;
  }

  // If still none, try to find/create a default teacher user
  if (!effectiveCreatorId) {
    try {
      const teacher = await prisma.user.findFirst({
        where: { role: 'TEACHER' },
        orderBy: { createdAt: 'asc' },
      });
      if (teacher) {
        effectiveCreatorId = teacher.id;
        console.log(`ℹ️  Using existing teacher: ${teacher.email} (${teacher.id})`);
      } else {
        // Create a default teacher
        const newTeacher = await prisma.user.create({
          data: {
            name: 'Question Import Bot',
            email: 'import-bot@jeemocks.com',
            phone: `9999999998`,
            passwordHash: 'imported-questions-no-login',
            role: 'TEACHER',
            plan: 'FREE',
          },
        });
        effectiveCreatorId = newTeacher.id;
        console.log(`ℹ️  Created import bot user: ${newTeacher.id}`);
      }
    } catch (err) {
      console.error(`❌ Could not resolve creator: ${err.message}`);
      console.error('   Pass a creator-user-id as the second argument.');
      process.exit(1);
    }
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
    createdBy: effectiveCreatorId,
  }));

  console.log(`\n📦 Importing ${prismaData.length} questions...`);
  console.log(`   Creator: ${effectiveCreatorId}`);
  console.log(`   Source:  ${data.source || 'unknown'}`);

  // Check for existing similar questions (by question_text substring)
  let duplicateCount = 0;
  for (let i = 0; i < prismaData.length; i++) {
    const q = prismaData[i];
    const fingerprint = q.questionText.substring(0, 80);
    const existing = await prisma.question.findFirst({
      where: {
        questionText: { startsWith: fingerprint },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) {
      console.log(`⚠️  Skipping Q${i}: duplicate detected (matches existing question ${existing.id})`);
      prismaData[i] = null; // mark for skip
      duplicateCount++;
    }
  }

  const toImport = prismaData.filter(Boolean);
  if (toImport.length === 0) {
    console.log('\n✅ All questions already exist. Nothing to import.');
    await prisma.$disconnect();
    return;
  }

  if (duplicateCount > 0) {
    console.log(`   Skipping ${duplicateCount} duplicates. Importing ${toImport.length} new questions.`);
  }

  // Confirm
  console.log(`\n⚠️  About to insert ${toImport.length} questions into the database.`);
  if (!process.argv.includes('--yes')) {
    console.log('   Press Ctrl+C to cancel, or re-run with --yes to proceed.');
    // We just wait a moment rather than prompting in a non-interactive environment
    await new Promise(r => setTimeout(r, 1000));
  }

  // Insert in batches
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE);
    try {
      const result = await prisma.question.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      console.log(`   Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.count} questions`);
    } catch (err) {
      console.error(`   Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${err.message}`);
    }
  }

  console.log(`\n✅ Import complete: ${totalInserted} questions inserted.`);
  console.log(`   Skipped: ${duplicateCount} duplicates, ${toImport.length - totalInserted} errors.`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Import failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
