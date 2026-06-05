import { getSource } from '../source-registry.js';
import { fetchHtml, ensureRawDir, downloadFile } from './base-fetcher.js';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Fetch the JEE Advanced archive page and extract paper links.
 * Returns an array of paper entries with year, type, and PDF URLs.
 */
export async function fetchJeeAdvancedArchive(sourceId) {
  const source = getSource(sourceId);
  const rawDir = ensureRawDir(sourceId);
  const html = await fetchHtml(source.url);

  // Save raw HTML for traceability
  writeFileSync(join(rawDir, 'archive.html'), html);

  // Extract paper links from the archive table
  const papers = [];

  // JEE Advanced archive page has a table with rows like:
  // 2024 | Question Paper | Answer Key | ...
  const tableRowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = tableRowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].trim());
    }

    if (cells.length < 3) continue;

    // First cell should contain year digits
    const yearMatch = cells[0].match(/(\d{4})/);
    if (!yearMatch) continue;

    const year = parseInt(yearMatch[1], 10);

    // Find PDF links in each cell
    const links = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(rowHtml)) !== null) {
      const href = linkMatch[1].trim();
      const text = linkMatch[2].trim().replace(/<[^>]+>/g, '').trim();
      const fullUrl = href.startsWith('http') ? href : new URL(href, source.baseUrl).href;
      links.push({ url: fullUrl, label: text });
    }

    if (links.length === 0) continue;

    papers.push({
      year,
      links,
      sourceUrl: source.url,
      sourceId: source.id,
    });
  }

  return papers;
}

/**
 * Download all PDFs for a given set of papers.
 */
export async function downloadJeeAdvancedPapers(papers) {
  const results = [];

  for (const paper of papers) {
    for (const link of paper.links) {
      const ext = link.url.endsWith('.pdf') ? '.pdf' : '.html';
      const safeName = `${paper.year}-${link.label.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;
      const rawDir = ensureRawDir(`jee_advanced_official`);
      const outputPath = join(rawDir, safeName);

      if (existsSync(outputPath)) {
        results.push({ url: link.url, path: outputPath, cached: true });
        continue;
      }

      try {
        const result = await downloadFile(link.url, outputPath);
        results.push({ url: link.url, path: result.path, size: result.size, cached: false });
      } catch (err) {
        results.push({ url: link.url, error: err.message });
      }
    }
  }

  return results;
}

export default { fetchJeeAdvancedArchive, downloadJeeAdvancedPapers };
