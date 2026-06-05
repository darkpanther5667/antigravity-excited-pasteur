#!/usr/bin/env node

/**
 * JEEmocks Question Ingestion Pipeline — Main CLI Entrypoint
 *
 * Usage:
 *   node src/index.js fetch <source-id>      Download source documents
 *   node src/index.js fetch --all             Download all sources
 *   node src/index.js parse <source-id>       Parse downloaded documents
 *   node src/index.js validate <file>         Validate a staging JSON file
 *   node src/index.js review <file>           Generate review report
 *   node src/index.js export <file>           Export to production format
 *   node src/index.js import <file> [--dry-run]
 *   node src/index.js sources                 List configured sources
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadSources, getSource, summarizeSources } from './source-registry.js';
import { reviewBatch, printReviewSummary } from './reviewer.js';
import { exportToJson, exportToCsv, exportImportReady } from './exporter.js';
import { validateStagingBatch } from './validator.js';
import { dryRunImport } from './importer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', '..', 'data');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === 'help') {
    printHelp();
    return;
  }

  switch (command) {
    case 'sources':
      cmdSources();
      break;

    case 'validate':
      await cmdValidate(args[1]);
      break;

    case 'review':
      await cmdReview(args[1]);
      break;

    case 'export':
      await cmdExport(args[1], args[2]);
      break;

    case 'import':
      await cmdImport(args[1], args.includes('--dry-run'));
      break;

    default:
      console.error(`Unknown command: "${command}"`);
      console.log('Run "node src/index.js --help" for usage.');
      process.exit(1);
  }
}

function printHelp() {
  console.log(`
JEEmocks Question Ingestion Pipeline

USAGE:
  node src/index.js <command> [options]

COMMANDS:
  sources                        List all configured sources
  fetch <source-id>              Download source archive pages/pdfs
  fetch --all                    Download all known sources
  parse <source-id>              Parse and normalize downloaded source
  validate <file>                Validate a staging/review JSON file
  review <file>                  Run full review on staging data
  export <file> [output]         Export staging data (defaults to data/review/)
  import <file> [--dry-run]      Dry-run or perform DB import

EXAMPLES:
  node src/index.js sources
  node src/index.js validate data/staging/sample.json
  node src/index.js review data/staging/sample.json
  node src/index.js export data/review/accepted.json
  node src/index.js import data/final/approved.json --dry-run
`);
}

function cmdSources() {
  console.log(summarizeSources());
}

async function cmdValidate(filePath) {
  if (!filePath || !existsSync(filePath)) {
    console.error('❌ Please provide a valid staging JSON file path.');
    process.exit(1);
  }

  const { readFileSync } = await import('fs');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records = data.records || data;

  const validation = validateStagingBatch(records);
  console.log(`\nValidation complete:`);
  console.log(`  Total:    ${validation.total}`);
  console.log(`  Valid:    ${validation.validCount} ✅`);
  console.log(`  Invalid:  ${validation.invalidCount} ❌`);
  console.log(`  Warnings: ${validation.totalWarnings}`);

  if (validation.invalidCount > 0) {
    console.log('\nFirst 10 errors:');
    for (const r of validation.results.filter(r => !r.valid).slice(0, 10)) {
      for (const e of r.errors) {
        console.log(`  ❌ ${e}`);
      }
    }
  }
}

async function cmdReview(filePath) {
  if (!filePath || !existsSync(filePath)) {
    console.error('❌ Please provide a valid staging JSON file path.');
    process.exit(1);
  }

  const { readFileSync } = await import('fs');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records = data.records || data;

  const review = reviewBatch(records);
  console.log(printReviewSummary(review));
}

async function cmdExport(filePath, outputPath) {
  if (!filePath || !existsSync(filePath)) {
    console.error('❌ Please provide a file path to export.');
    process.exit(1);
  }

  const { readFileSync } = await import('fs');
  const raw = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const records = data.records || data;

  // Determine output paths
  const baseName = filePath.replace(/\.json$/, '').split(/[/\\]/).pop() || 'export';
  const reviewDir = join(DATA_DIR, 'review');
  const finalDir = join(DATA_DIR, 'final');

  const jsonPath = outputPath || join(reviewDir, `${baseName}-review.json`);
  const csvPath = join(reviewDir, `${baseName}-review.csv`);
  const finalPath = join(finalDir, `${baseName}-approved-import-ready.json`);

  // Run review first
  const review = reviewBatch(records);

  // Export all tiers
  const accepted = review.tiers.importReady.map(r => r.record);
  const needsReview = review.tiers.needsManualReview.map(r => r.record);

  exportToJson(records, jsonPath, { summary: review.summary });
  exportToCsv(records, csvPath);

  if (accepted.length > 0) {
    const imported = exportImportReady(accepted, finalPath);
    console.log(`\n📦 Import-ready file: ${imported}`);
  }

  console.log(`\n📋 Review JSON: ${jsonPath}`);
  console.log(`📊 Review CSV:  ${csvPath}`);
  console.log(printReviewSummary(review));

  if (needsReview.length > 0) {
    const needsReviewPath = join(reviewDir, `${baseName}-needs-review.json`);
    exportToJson(needsReview, needsReviewPath);
    console.log(`⚠️  Needs review: ${needsReviewPath} (${needsReview.length} records)`);
  }
}

async function cmdImport(filePath, dryRun) {
  if (!filePath || !existsSync(filePath)) {
    console.error('❌ Please provide an import-ready JSON file path.');
    process.exit(1);
  }

  const result = dryRunImport(filePath);

  if (!result.success) {
    console.error(`❌ ${result.error}`);
    process.exit(1);
  }

  console.log(`\n📦 Import dry-run for: ${filePath}`);
  console.log(`   Total questions:  ${result.total}`);
  console.log(`   Valid:            ${result.validCount}`);
  console.log(`   With issues:      ${result.issueCount}`);
  console.log(`   Source:           ${result.provenance.source}`);
  if (result.provenance.sources.length > 0) {
    console.log(`   From sources:     ${result.provenance.sources.join(', ')}`);
  }

  if (result.issueCount > 0) {
    console.log('\n⚠️  Issues found:');
    for (const issue of result.issues.slice(0, 15)) {
      console.log(`   [${issue.index}] ${issue.issues.join('; ')}`);
      console.log(`       text: ${issue.questionText}`);
    }
    console.log(`\n❌ Fix issues before importing. Run with --dry-run to re-check.`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n✅ ${result.message}`);
    console.log('Pass without --dry-run to actually import (requires DB connection).');
    return;
  }

  // Actual import — this should be run from the backend context
  console.log('\n⚠️  To perform actual import, run from the backend directory:');
  console.log('   cd backend && node ../scripts/question-ingest/src/execute-import.js <file> <creator-id>');
  console.log('\nOr approve the dry-run and use the import script.');
}

// Run
main().catch(err => {
  console.error('Pipeline error:', err);
  process.exit(1);
});
