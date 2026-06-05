/**
 * Parser for SATHEE JEE PYQ pages.
 *
 * SATHEE (sathee.iitk.ac.in) offers structured JEE PYQ content
 * organized by chapter. Questions are embedded in HTML and typically
 * have well-defined structure.
 */

/**
 * Parse SATHEE PYQ HTML page and extract questions.
 * Returns an array of raw question objects.
 */
export function parseSatheePyqPage(html, metadata = {}) {
  const questions = [];

  // SATHEE questions are typically in <div class="question"> or similar containers
  const questionBlockRegex = /<div[^>]*class="[^"]*question[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;

  let match;
  while ((match = questionBlockRegex.exec(html)) !== null) {
    const block = match[1];

    // Extract question text
    const textMatch = block.match(/<p[^>]*class="[^"]*question-text[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
      || block.match(/<div[^>]*class="[^"]*text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    const questionText = textMatch
      ? cleanHtml(textMatch[1])
      : null;

    // Extract options
    const options = {};
    const optionRegex = /<li[^>]*class="[^"]*option[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
    let optMatch;
    let optIndex = 0;
    const optKeys = ['a', 'b', 'c', 'd', 'e'];

    while ((optMatch = optionRegex.exec(block)) !== null && optIndex < optKeys.length) {
      options[optKeys[optIndex]] = cleanHtml(optMatch[1]);
      optIndex++;
    }

    // Try to extract correct answer from data attributes or answer spans
    const answerMatch = block.match(/data-correct=["']([^"']*)["']/i)
      || block.match(/<span[^>]*class="[^"]*answer[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
      || block.match(/correct\s*(?:answer|option|is)[:\s]*([A-Da-d])/i);

    const correctAnswer = answerMatch
      ? answerMatch[1].trim().toLowerCase()
      : null;

    // Try to extract solution
    const solutionMatch = block.match(/<div[^>]*class="[^"]*solution[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || block.match(/<div[^>]*class="[^"]*explanation[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

    const solution = solutionMatch ? cleanHtml(solutionMatch[1]) : null;

    if (questionText) {
      questions.push({
        question_text: questionText,
        ...options,
        correct_answer: correctAnswer,
        solution,
        extraction_method: 'sathee-html',
        extraction_confidence: correctAnswer ? 'medium' : 'low',
        ...metadata,
      });
    }
  }

  // Fallback: try simpler pattern if no structured blocks found
  if (questions.length === 0) {
    return parseSatheeSimple(html, metadata);
  }

  return questions;
}

/**
 * Fallback parser for SATHEE pages with less structured HTML.
 */
function parseSatheeSimple(html, metadata) {
  const questions = [];

  // Try to find question content in any well-structured div
  const contentBlocks = html.split(/<div[^>]*class="[^"]*(?:content|main|pyq)[^"]*"[^>]*>/gi);

  for (const block of contentBlocks) {
    const paragraphs = block.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (!paragraphs || paragraphs.length < 2) continue;

    const textParts = paragraphs.map(p => cleanHtml(p)).filter(t => t.length > 15);
    if (textParts.length === 0) continue;

    questions.push({
      question_text: textParts[0],
      extraction_method: 'sathee-html-fallback',
      extraction_confidence: 'low',
      manual_review_required: true,
      flag_reasons: ['sathee_fallback_parse'],
      ...metadata,
    });
  }

  return questions;
}

/**
 * Clean HTML tags from extracted text while preserving LaTeX.
 */
function cleanHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export default { parseSatheePyqPage };
