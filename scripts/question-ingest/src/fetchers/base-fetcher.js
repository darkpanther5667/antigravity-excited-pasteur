import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const DEFAULT_RAW_DIR = join(process.cwd(), 'data', 'raw');

/**
 * Download a file from a URL to a local path.
 * Returns the local file path on success.
 */
export function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;

    mod.get(url, { headers: { 'User-Agent': 'JEEmocks-Ingestion/1.0' } }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        return resolve(downloadFile(redirectUrl, outputPath));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const contentType = res.headers['content-type'] || '';
      const contentLength = parseInt(res.headers['content-length'] || '0', 10);

      const stream = createWriteStream(outputPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve({ path: outputPath, contentType, size: contentLength });
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Fetch HTML content from a URL as text.
 */
export function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;

    mod.get(url, { headers: { 'User-Agent': 'JEEmocks-Ingestion/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).href;
        return resolve(fetchHtml(redirectUrl));
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Ensure the raw data directory exists.
 */
export function ensureRawDir(sourceId) {
  const dir = join(DEFAULT_RAW_DIR, sourceId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get the raw data directory path.
 */
export function getRawDir(sourceId) {
  return join(DEFAULT_RAW_DIR, sourceId);
}

export default { downloadFile, fetchHtml, ensureRawDir, getRawDir };
