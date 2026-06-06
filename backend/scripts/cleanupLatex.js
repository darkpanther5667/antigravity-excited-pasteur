#!/usr/bin/env node

/**
 * Fast LaTeX cleanup using raw SQL string replacements.
 *
 * Usage: node scripts/cleanupLatex.js
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const prisma = new PrismaClient();

const FIXES = [
  { cols: ['question_text','option_a','option_b','option_c','option_d','solution'], search: '\\(', replace: '$' },
  { cols: ['question_text','option_a','option_b','option_c','option_d','solution'], search: '\\)', replace: '$' },
  { cols: ['question_text','solution'], search: '\\[', replace: '$$' },
  { cols: ['question_text','solution'], search: '\\]', replace: '$$' },
  { cols: ['question_text','solution'], search: '[image]', replace: '' },
  { cols: ['solution'], search: '$$-$$', replace: '-' },
];

async function main() {
  console.log('📊 Running LaTeX cleanup...\n');

  for (const fix of FIXES) {
    for (const col of fix.cols) {
      // $executeRawUnsafe parameter binding ($1, $2) handles escaping correctly
      const sql = `UPDATE questions SET ${col} = REPLACE(${col}, $1, $2)`;
      try {
        const r = await prisma.$executeRawUnsafe(sql, fix.search, fix.replace);
        if (r > 0) console.log(`  ✓ ${col}: REPLACE('${fix.search}','${fix.replace}') → ${r} rows`);
      } catch (e) {
        console.log(`  ✗ ${col}: ${e.message.slice(0, 80)}`);
      }
    }
  }

  console.log('\n✅ Done');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌', err);
  prisma.$disconnect();
  process.exit(1);
});
