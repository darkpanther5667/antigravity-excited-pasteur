#!/usr/bin/env node

/**
 * Fix underscores and carets outside math mode via parameterized queries.
 * Uses String.fromCharCode(92) to build literal backslash sequences.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();
const COLS = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'solution'];
const BS = String.fromCharCode(92); // literal backslash

async function main() {
  console.log('Fixing subscripts/superscripts outside math mode...\n');

  function cond(col) {
    return `POSITION('_' IN ${col}) > 0 AND POSITION('$' IN COALESCE(question_text,'')) = 0 AND deleted_at IS NULL`;
  }
  function condHat(col) {
    return `POSITION('^' IN ${col}) > 0 AND POSITION('$' IN COALESCE(question_text,'')) = 0 AND deleted_at IS NULL`;
  }

  for (const col of COLS) {
    let total = 0;

    // _digits → <sub>digits</sub>
    const p1 = '_+(' + BS + 'd+)';
    const r1 = await prisma.$executeRawUnsafe(
      `UPDATE questions SET ${col} = REGEXP_REPLACE(${col}, $1, $2, 'g') WHERE ${cond(col)}`,
      p1, '<sub>' + BS + '1</sub>'
    );
    total += r1;

    // _UPPER → <sub>UPPER</sub>
    const p2 = '_+([A-Z])(' + BS + 'd*)';
    const r2 = await prisma.$executeRawUnsafe(
      `UPDATE questions SET ${col} = REGEXP_REPLACE(${col}, $1, $2, 'g') WHERE ${cond(col)}`,
      p2, '<sub>' + BS + '1</sub>' + BS + '2'
    );
    total += r2;

    // _lower → <sub>lower</sub>
    const p2b = '_+([a-z])(' + BS + 'd*)';
    const r2b = await prisma.$executeRawUnsafe(
      `UPDATE questions SET ${col} = REGEXP_REPLACE(${col}, $1, $2, 'g') WHERE ${cond(col)}`,
      p2b, '<sub>' + BS + '1</sub>' + BS + '2'
    );
    total += r2b;

    // ^(digits+sign?) or ^(sign) → <sup>...</sup>
    const pHat = BS + '^(' + BS + 'd+[' + BS + '-–]?' + BS + 'd*|' + BS + 'd*[' + BS + '-–]' + BS + 'd*)';
    const r3 = await prisma.$executeRawUnsafe(
      `UPDATE questions SET ${col} = REGEXP_REPLACE(${col}, $1, $2, 'g') WHERE ${condHat(col)}`,
      pHat, '<sup>' + BS + '1</sup>'
    );
    total += r3;

    if (total > 0) console.log(`  ${col}: ${total} updates`);
  }

  // Remaining _ outside math
  const [rem] = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM questions WHERE POSITION('_' IN question_text) > 0 AND POSITION('$' IN COALESCE(question_text,'')) = 0 AND deleted_at IS NULL`);
  console.log(`\nRemaining _ outside math: ${rem.cnt}`);
  if (rem.cnt > 0) {
    const s = await prisma.$queryRawUnsafe(`SELECT subject, LEFT(question_text,150) as t FROM questions WHERE POSITION('_' IN question_text) > 0 AND POSITION('$' IN COALESCE(question_text,'')) = 0 AND deleted_at IS NULL LIMIT 5`);
    for (const r of s) console.log(`  ${r.subject}: ${r.t}`);
  }

  // Show fixed samples
  console.log('\nFixed samples (checking for $1 artifacts):');
  const bad = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as cnt FROM questions WHERE question_text LIKE '%' || chr(36) || '1%' AND deleted_at IS NULL AND POSITION('$' IN COALESCE(question_text,'')) > 0`);
  console.log(`Questions with literal \$1 in text: ${bad.cnt}`);

  const fixed = await prisma.$queryRawUnsafe(`SELECT subject, question_text FROM questions WHERE POSITION('<sub>' IN question_text) > 0 LIMIT 2`);
  for (const r of fixed) console.log(`  ${r.subject}: ${r.question_text.slice(0, 220)}`);

  await prisma.$disconnect();
}

main().catch(err => { console.error('\nFatal:', err.message); prisma.$disconnect(); process.exit(1); });
