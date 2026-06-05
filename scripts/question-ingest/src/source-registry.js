import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, '..', 'config', 'sources.json');

let _sources = null;

/**
 * Load source definitions from config/sources.json.
 * Caches after first load.
 */
export function loadSources() {
  if (_sources) return _sources;

  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Source config not found at ${CONFIG_PATH}`);
  }

  const raw = readFileSync(CONFIG_PATH, 'utf-8');
  const parsed = JSON.parse(raw);

  // Build lookup map
  const byId = {};
  const byType = {};

  for (const [key, source] of Object.entries(parsed)) {
    if (!source.id) source.id = key;
    byId[source.id] = source;
    if (!byType[source.type]) byType[source.type] = [];
    byType[source.type].push(source);
  }

  _sources = { all: Object.values(parsed), byId, byType };
  return _sources;
}

/**
 * Get a specific source definition by its id.
 */
export function getSource(sourceId) {
  const { byId } = loadSources();
  const source = byId[sourceId];
  if (!source) {
    throw new Error(`Unknown source: "${sourceId}". Available: ${Object.keys(byId).join(', ')}`);
  }
  return source;
}

/**
 * Get all source IDs.
 */
export function getSourceIds() {
  return loadSources().all.map(s => s.id);
}

/**
 * Get sources filtered by legal confidence level.
 */
export function getSourcesByLegalConfidence(level) {
  return loadSources().all.filter(s => s.legal?.confidence === level);
}

/**
 * Quick summary of all sources.
 */
export function summarizeSources() {
  const { all, byType } = loadSources();

  const lines = [];
  lines.push(`Total sources: ${all.length}`);
  lines.push('');

  for (const [type, sources] of Object.entries(byType)) {
    lines.push(`  ${type.toUpperCase()} (${sources.length}):`);
    for (const s of sources) {
      lines.push(`    - ${s.name} (${s.id})`);
      lines.push(`      URL: ${s.url}`);
      lines.push(`      Format: ${s.format} | Legal: ${s.legal?.confidence}`);
      lines.push(`      Est. questions: ${s.extraction?.estimated_count || 'unknown'}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default { loadSources, getSource, getSourceIds, getSourcesByLegalConfidence, summarizeSources };
