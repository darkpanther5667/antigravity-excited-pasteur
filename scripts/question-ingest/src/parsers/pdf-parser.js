/**
 * PDF parser for JEE question papers.
 *
 * This is a structure-aware parser that attempts to extract individual
 * questions, options, and answers from official JEE PDFs.
 *
 * LIMITATIONS:
 * - Official JEE PDFs are scanned images or locked PDFs in many cases.
 * - Text extraction from image-based PDFs will fail gracefully.
 * - Marked-for-review by default since PDF structure is variable.
 */
import { readFileSync, existsSync } from 'fs';

/**
 * Attempt to extract text from a PDF file using pdf-parse.
 * Falls back gracefully if the PDF is image-based/encrypted.
 */
export async function parsePdfText(filePath) {
  if (!existsSync(filePath)) {
    return { success: false, error: `File not found: ${filePath}`, text: null };
  }

  try {
    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    if (!data.text || data.text.trim().length < 50) {
      return {
        success: false,
        error: 'PDF extracted minimal or no text (likely scanned/image-based)',
        text: null,
        pageCount: data.numpages,
      };
    }

    return {
      success: true,
      text: data.text,
      pageCount: data.numpages,
      metadata: data.metadata || {},
    };
  } catch (err) {
    return {
      success: false,
      error: `PDF parse error: ${err.message}`,
      text: null,
    };
  }
}

/**
 * Attempt to split extracted PDF text into individual questions.
 * Uses pattern matching for question numbering (Q.1, 1., etc.)
 * and option patterns (A) B) C) D) or (A) (B) (C) (D)).
 *
 * This is heuristic and will mark results for manual review.
 */
export function splitQuestionsFromText(text) {
  if (!text) return [];

  const questions = [];

  // Common JEE question numbering patterns
  const questionBoundaryRegex = /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*(?=[A-Z])/gm;

  let lastIndex = 0;
  let match;

  while ((match = questionBoundaryRegex.exec(text)) !== null) {
    const questionNum = parseInt(match[1], 10);
    const start = match.index;

    if (lastIndex > 0) {
      const block = text.substring(lastIndex, start).trim();
      if (block.length > 20) {
        questions.push({
          number: currentNum,
          raw_text: block,
        });
      }
    }

    const currentNum = questionNum;
    lastIndex = start;
  }

  // Last question
  if (lastIndex > 0) {
    const block = text.substring(lastIndex).trim();
    if (block.length > 20) {
      questions.push({
        number: questions.length + 1,
        raw_text: block,
      });
    }
  }

  return questions;
}

/**
 * Attempt to extract options from question text block.
 */
export function extractOptions(block) {
  const options = {};
  const patterns = [
    // Pattern: (A) text (B) text (C) text (D) text
    /\(([A-D])\)\s*([\s\S]*?)(?=\s*\([A-D]\)\s*|\s*$)/g,
    // Pattern: A. text B. text C. text D. text
    /([A-D])[.)]\s*([\s\S]*?)(?=\s*[A-D][.)]\s*|\s*$)/g,
  ];

  for (const pattern of patterns) {
    let match;
    const extracted = {};
    while ((match = pattern.exec(block)) !== null) {
      extracted[match[1].toLowerCase()] = match[2].trim();
    }
    if (Object.keys(extracted).length >= 3) {
      Object.assign(options, extracted);
    }
  }

  return options;
}

export default { parsePdfText, splitQuestionsFromText, extractOptions };
