#!/usr/bin/env node

/**
 * Bulk Test Creator
 * Creates NTA Mains tests using available questions, then publishes them.
 *
 * Usage: node scripts/createTests.js [count]
 *   count: number of tests to create (default: auto-calculate from question count)
 *
 * Run from the backend directory with DATABASE_URL set.
 * Questions must already exist in the DB (run generateQuestions.js first).
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createNtaMainsTest } from '../src/services/ntaTestFactory.js';

dotenv.config();

const prisma = new PrismaClient();

const QUESTIONS_PER_TEST = 75;

async function main() {
  const targetTests = parseInt(process.argv[2]) || 0;

  // Count questions
  const totalQuestions = await prisma.question.count({ where: { deletedAt: null } });
  const totalBySubject = await Promise.all(
    ['PHYSICS', 'CHEMISTRY', 'MATHS'].map(subject =>
      prisma.question.count({
        where: { subject, deletedAt: null }
      })
    )
  );

  console.log(`📊 Questions available: ${totalQuestions} total`);
  console.log(`   Physics: ${totalBySubject[0]}, Chemistry: ${totalBySubject[1]}, Maths: ${totalBySubject[2]}`);

  // Check per-subject SINGLE + INTEGER counts
  const counts = {};
  for (const subject of ['PHYSICS', 'CHEMISTRY', 'MATHS']) {
    const single = await prisma.question.count({
      where: { subject, type: 'SINGLE', deletedAt: null }
    });
    const integer = await prisma.question.count({
      where: { subject, type: 'INTEGER', deletedAt: null }
    });
    counts[subject] = { single, integer };
    console.log(`   ${subject}: ${single} SINGLE, ${integer} INTEGER`);
  }

  // Calculate max tests possible (limited by the scarcest subject+type combo)
  const testsFromSingle = Math.min(
    Math.floor(counts.PHYSICS.single / 20),
    Math.floor(counts.CHEMISTRY.single / 20),
    Math.floor(counts.MATHS.single / 20)
  );
  const testsFromInteger = Math.min(
    Math.floor(counts.PHYSICS.integer / 5),
    Math.floor(counts.CHEMISTRY.integer / 5),
    Math.floor(counts.MATHS.integer / 5)
  );
  const maxTests = Math.min(testsFromSingle, testsFromInteger);

  if (maxTests === 0) {
    console.log('❌ Not enough questions to create any test.');
    console.log('   Need per subject: 20 SINGLE + 5 INTEGER');
    await prisma.$disconnect();
    return;
  }

  // Use targetTests if specified and valid, else all possible
  const testsToCreate = targetTests > 0 ? Math.min(targetTests, maxTests) : maxTests;
  console.log(`\n📝 Will create ${testsToCreate} tests\n`);

  // Find admin user
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  }
  if (!admin) {
    admin = await prisma.user.findFirst();
  }
  if (!admin) {
    console.error('❌ No user found in database.');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`👤 Using user: ${admin.id} (${admin.name || admin.email})`);

  // Create tests
  const batchSize = 5;
  let created = 0;

  for (let i = 0; i < testsToCreate; i++) {
    const testNumber = i + 1;
    const title = `JEE Main Mock Test #${testNumber}`;
    // Space tests one day apart starting from a past date
    const scheduledAt = new Date(Date.now() - (testsToCreate - i) * 24 * 60 * 60 * 1000);

    try {
      const test = await createNtaMainsTest(title, scheduledAt.toISOString(), admin.id);

      // Publish the test
      await prisma.test.update({
        where: { id: test.id },
        data: { isPublished: true }
      });

      created++;
      if (created % batchSize === 0 || created === testsToCreate) {
        console.log(`✅ Created & published ${created}/${testsToCreate} tests (${test.title})`);
      }
    } catch (err) {
      if (err.shortfall) {
        console.log(`❌ Error at test #${testNumber}: ${err.message}`);
        for (const s of err.shortfall) {
          console.log(`   ${s.subject} ${s.type}: need ${s.needed}, have ${s.available}`);
        }
        break;
      }
      console.error(`❌ Error at test #${testNumber}:`, err.message);
      // If it's a transient error, retry once
      if (i < testsToCreate - 1) {
        console.log('   Retrying once...');
        try {
          const test = await createNtaMainsTest(title, scheduledAt.toISOString(), admin.id);
          await prisma.test.update({ where: { id: test.id }, data: { isPublished: true } });
          created++;
          console.log(`✅ Created & published ${created}/${testsToCreate} on retry`);
        } catch (retryErr) {
          console.error(`   Retry failed, moving on.`);
          break;
        }
      } else {
        break;
      }
    }
  }

  // Summary
  const totalTests = await prisma.test.count();
  const publishedTests = await prisma.test.count({ where: { isPublished: true } });

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} tests this session`);
  console.log(`   Total tests in DB: ${totalTests}`);
  console.log(`   Published: ${publishedTests}`);
  console.log(`   Questions used per test: ${QUESTIONS_PER_TEST}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
