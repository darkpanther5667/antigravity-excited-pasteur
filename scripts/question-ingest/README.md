# JEEmocks Question Ingestion Pipeline

A staged, review-first pipeline for building a legally safe JEE question bank from official PYQ sources.

## Philosophy

1. **Provenance first** — every question carries its source, extraction confidence, and legal confidence.
2. **Review before import** — nothing goes into the production database without a manual review step.
3. **No copyright violations** — only official/attributable public sources with high legal confidence.
4. **Staged pipeline** — fetch → parse → normalize → validate → review → approve → import.

## Directory Structure

```
scripts/question-ingest/
├── config/
│   └── sources.json            # Source definitions (URLs, legal status)
├── src/
│   ├── index.js                # CLI entrypoint
│   ├── source-registry.js      # Source loading/lookup
│   ├── staging-schema.js       # Staging record schema + helpers
│   ├── normalizer.js           # Raw → staging normalization
│   ├── validator.js            # Validation + duplicate detection
│   ├── reviewer.js             # Full review pipeline
│   ├── exporter.js             # JSON/CSV export
│   ├── importer.js             # Dry-run + production import prep
│   ├── execute-import.js       # Actual DB import (Prisma)
│   ├── sample-generator.js     # Generate 15 sample questions
│   └── fetchers/
│       ├── base-fetcher.js     # HTTP download utilities
│       ├── jee-advanced-fetcher.js
│       └── sathee-fetcher.js
│   └── parsers/
│       ├── pdf-parser.js       # PDF text extraction
│       └── sathee-parser.js    # SATHEE HTML extraction
├── package.json
└── README.md

data/
├── raw/                        # Downloaded source documents (gitignored)
├── staging/                    # Normalized staging JSON files
├── review/                     # Review artifacts + reports
└── final/                      # Approved, import-ready files
```

## Supported Sources

| Source | Type | Legal Confidence | Format | Est. Volume |
|--------|------|-----------------|--------|-------------|
| JEE Advanced Official Archive | Official | High | PDF | ~250 |
| JEE Main NTA Archive | Official | High | PDF | ~500 |
| SATHEE JEE PYQ (IIT Kanpur) | Official | High | HTML | ~300 |

## Usage

### List Sources
```bash
node scripts/question-ingest/src/index.js sources
```

### Generate Sample Data
```bash
node scripts/question-ingest/src/sample-generator.js
```

### Validate Staging Data
```bash
node scripts/question-ingest/src/index.js validate data/staging/jee-main-sample.json
```

### Run Full Review
```bash
node scripts/question-ingest/src/index.js review data/staging/jee-main-sample.json
```

### Export to Production Format
```bash
node scripts/question-ingest/src/index.js export data/staging/jee-main-sample.json
```

### Dry-Run Import Check
```bash
node scripts/question-ingest/src/index.js import data/final/sample-approved-import-ready.json --dry-run
```

### Execute DB Import (from backend directory)
```bash
cd backend
node ../scripts/question-ingest/src/execute-import.js ../data/final/sample-approved-import-ready.json dev-teacher-id
```

## Staging Record Schema

Each question in the staging format includes:

- **Core**: subject, chapter, topic, difficulty, type, question_text, options, correct_answer, solution, year, exam_type
- **Provenance**: source_type, source_name, source_url, source_id, source_year, paper_label
- **Extraction metadata**: extraction_method, extraction_date, extraction_confidence, legal_confidence
- **Review flags**: manual_review_required, review_notes, flag_reasons[], duplicate_group_id

## Legal Rules

1. Only use sources with `legal_confidence: 'high'` for automatic acceptance.
2. All extracted records are marked `manual_review_required: true` by default.
3. Questions flagged `low_legal_confidence` are never auto-approved.
4. The pipeline never imports directly to the DB without a review step.
5. To add a new source, update `config/sources.json` and create a fetcher/parser.

## Adding a New Source

1. Add source definition to `config/sources.json`
2. Create a fetcher in `src/fetchers/` (download layer)
3. Create a parser in `src/parsers/` (extraction layer)
4. The normalizer handles mapping to staging schema automatically
5. Run validate → review → export before any import
