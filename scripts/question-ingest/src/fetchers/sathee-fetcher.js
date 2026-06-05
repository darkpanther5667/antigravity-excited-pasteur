import { getSource } from '../source-registry.js';
import { fetchHtml, ensureRawDir } from './base-fetcher.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Fetch the SATHEE JEE PYQ listing page and extract subject/chapter links.
 */
export async function fetchSatheePyqIndex(sourceId) {
  const source = getSource(sourceId);
  const rawDir = ensureRawDir(sourceId);
  const html = await fetchHtml(source.url);

  writeFileSync(join(rawDir, 'index.html'), html);

  // SATHEE lists subjects and chapters with links to PYQs
  const linkRegex = /<a[^>]*href="([^"]*\/jee-pyq\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const subjects = [];

  const seen = new Set();
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const text = match[2].replace(/<[^>]+>/g, '').trim();

    if (seen.has(href)) continue;
    seen.add(href);

    const fullUrl = href.startsWith('http') ? href : new URL(href, source.baseUrl).href;

    // Determine subject from URL or text
    let subject = null;
    const lower = text.toLowerCase() + ' ' + href.toLowerCase();
    if (/\bphysics\b/.test(lower)) subject = 'PHYSICS';
    else if (/\bchemistry\b/.test(lower)) subject = 'CHEMISTRY';
    else if (/\bmathematics\b|\bmaths\b/.test(lower)) subject = 'MATHS';

    subjects.push({
      label: text,
      url: fullUrl,
      subject,
    });
  }

  return subjects;
}

export default { fetchSatheePyqIndex };
