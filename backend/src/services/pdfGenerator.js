/**
 * PDF Report Generator Service
 * Generates 15 types of analytics PDF reports using pdfkit.
 *
 * Uses analyticsService data and renders into downloadable PDFs.
 */

import PDFDocument from 'pdfkit';
import * as analyticsService from './analyticsService.js';

// ─── Styling Constants ─────────────────────────────────────────
const COLORS = {
  primary: '#1a237e',      // dark indigo
  secondary: '#283593',
  accent: '#3949ab',
  success: '#2e7d32',
  warning: '#f57f17',
  danger: '#c62828',
  light: '#e8eaf6',
  white: '#ffffff',
  text: '#212121',
  textLight: '#616161',
  border: '#bdbdbd',
  gray: '#9e9e9e',
  lightGray: '#f5f5f5',
};

const FONTS = {
  regular: 'Helvetica',
  bold: 'Helvetica-Bold',
  mono: 'Courier',
};

const PAGE = {
  margin: 50,
  width: 595.28,   // A4
  height: 841.89,
  contentWidth: 495.28, // width - 2*margin
};

// ─── Utilities ──────────────────────────────────────────────────

function drawHeader(doc, title, subtitle = '') {
  // Top bar
  doc.rect(0, 0, PAGE.width, 8).fill(COLORS.primary);
  doc
    .fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(20)
    .text('JEEmocks', PAGE.margin, 28);
  if (subtitle) {
    doc
      .fillColor(COLORS.textLight)
      .font(FONTS.regular)
      .fontSize(10)
      .text(subtitle, PAGE.margin, 52);
  }
  doc
    .fillColor(COLORS.text)
    .font(FONTS.bold)
    .fontSize(16)
    .text(title, PAGE.margin, subtitle ? 68 : 52);
  doc.moveDown(1.5);
}

function drawFooter(doc, pageNum) {
  const bottom = PAGE.height - 30;
  doc
    .fontSize(8)
    .fillColor(COLORS.gray)
    .font(FONTS.regular);
  doc.text('JEEmocks — AI-powered JEE Analytics', PAGE.margin, bottom, { align: 'left' });
  doc.text(`Page ${pageNum}`, PAGE.margin, bottom, { align: 'right' });
  doc
    .strokeColor(COLORS.border)
    .moveTo(PAGE.margin, bottom - 4)
    .lineTo(PAGE.width - PAGE.margin, bottom - 4)
    .stroke();
}

function addPage(doc) {
  doc.addPage();
  const pageNum = doc.bufferedPageRange().count;
  drawFooter(doc, pageNum);
  return pageNum;
}

function sectionTitle(doc, text) {
  doc
    .fillColor(COLORS.primary)
    .font(FONTS.bold)
    .fontSize(14)
    .text(text, PAGE.margin, doc.y + 12);
  doc
    .strokeColor(COLORS.accent)
    .moveTo(PAGE.margin, doc.y + 2)
    .lineTo(PAGE.width - PAGE.margin, doc.y + 2)
    .stroke();
  doc.moveDown(1);
}

function subsectionTitle(doc, text) {
  doc
    .fillColor(COLORS.secondary)
    .font(FONTS.bold)
    .fontSize(11)
    .text(text, PAGE.margin, doc.y + 6);
  doc.moveDown(0.5);
}

function bodyText(doc, text, size = 9) {
  doc
    .fillColor(COLORS.text)
    .font(FONTS.regular)
    .fontSize(size)
    .text(text, PAGE.margin, doc.y, { align: 'left' });
  doc.moveDown(0.3);
}

function drawStatCard(doc, label, value, x, y, w = 110, color = COLORS.primary) {
  doc
    .roundedRect(x, y, w, 45, 4)
    .fill(COLORS.lightGray);
  doc
    .fillColor(color)
    .font(FONTS.bold)
    .fontSize(16)
    .text(String(value), x + 8, y + 6, { width: w - 16, align: 'center' });
  doc
    .fillColor(COLORS.textLight)
    .font(FONTS.regular)
    .fontSize(7)
    .text(label, x + 8, y + 28, { width: w - 16, align: 'center' });
}

function drawTable(doc, headers, rows, colWidths) {
  const startY = doc.y;
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  let xPos = PAGE.margin;

  // Header row
  doc.rect(xPos, startY, tableWidth, 18).fill(COLORS.primary);
  headers.forEach((h, i) => {
    doc
      .fillColor(COLORS.white)
      .font(FONTS.bold)
      .fontSize(8)
      .text(h, xPos + 4, startY + 4, { width: colWidths[i] - 4, align: 'left' });
    xPos += colWidths[i];
  });

  // Data rows
  let y = startY + 18;
  rows.forEach((row, ri) => {
    xPos = PAGE.margin;
    const bg = ri % 2 === 0 ? COLORS.white : COLORS.lightGray;
    doc.rect(xPos, y, tableWidth, 16).fill(bg);
    row.forEach((cell, ci) => {
      doc
        .fillColor(COLORS.text)
        .font(FONTS.regular)
        .fontSize(7.5)
        .text(String(cell), xPos + 4, y + 3, { width: colWidths[ci] - 4, align: 'left' });
      xPos += colWidths[ci];
    });
    y += 16;
  });

  doc.y = y + 6;
}

// ─── 15 Report Generators ──────────────────────────────────────

/**
 * Report 1: Overall Performance Summary
 */
async function reportOverview(doc, userId) {
  const data = await analyticsService.getOverview(userId);
  sectionTitle(doc, '1. Overall Performance Summary');
  if (!data) { bodyText(doc, 'No data available.'); return; }

  // Stats cards
  const cardW = (PAGE.contentWidth - 20) / 3;
  let cx = PAGE.margin;
  drawStatCard(doc, 'Tests Taken', data.total_tests_taken || 0, cx, doc.y + 4, cardW);
  cx += cardW + 10;
  drawStatCard(doc, 'Avg Score', `${data.average_score || 0}`, cx, doc.y, cardW, COLORS.success);
  cx += cardW + 10;
  drawStatCard(doc, 'Avg Percentile', `${data.average_percentile || 0}`, cx, doc.y, cardW, COLORS.accent);
  doc.moveDown(5);

  cx = PAGE.margin;
  drawStatCard(doc, 'Best Score', `${data.best_score || 0}`, cx, doc.y + 4, cardW, COLORS.primary);
  cx += cardW + 10;
  drawStatCard(doc, 'Best Rank', `${data.best_rank || '-'}`, cx, doc.y, cardW, COLORS.warning);
  cx += cardW + 10;
  drawStatCard(doc, 'Time Spent', `${data.total_time_spent_hours || 0}h`, cx, doc.y, cardW, COLORS.textLight);
  doc.moveDown(5);

  // Subject averages
  subsectionTitle(doc, 'Subject Averages');
  const subj = data.subject_averages || {};
  drawTable(doc,
    ['Subject', 'Avg Score', 'Avg Accuracy (%)'],
    [
      ['Physics', String(subj.physics?.avg_score || 0), `${subj.physics?.avg_accuracy || 0}%`],
      ['Chemistry', String(subj.chemistry?.avg_score || 0), `${subj.chemistry?.avg_accuracy || 0}%`],
      ['Maths', String(subj.maths?.avg_score || 0), `${subj.maths?.avg_accuracy || 0}%`],
    ],
    [160, 160, 140]
  );

  bodyText(doc, `Strongest Subject: ${data.strongest_subject || 'N/A'}  |  Weakest Subject: ${data.weakest_subject || 'N/A'}`);
  bodyText(doc, `Recent Trend: ${data.recent_trend || 'stable'}`);
  if (data.best_test) {
    bodyText(doc, `Best Test: ${data.best_test.title} (Score: ${data.best_test.score}, Percentile: ${data.best_test.percentile})`);
  }
}

/**
 * Report 2-4: Subject Chapter Analysis (Physics/Chemistry/Maths)
 */
async function reportSubject(doc, userId, subject) {
  const data = await analyticsService.getSubjectBreakdown(userId, subject);
  sectionTitle(doc, `${subject} Chapter Analysis`);
  if (!data) { bodyText(doc, 'No data available.'); return; }

  bodyText(doc, `Overall Accuracy: ${data.overall_accuracy || 0}% | Avg Score/Test: ${data.avg_score_per_test || 0}`);

  if (data.chapter_breakdown && data.chapter_breakdown.length > 0) {
    subsectionTitle(doc, 'Chapter-wise Performance');
    const rows = data.chapter_breakdown.map(ch => [
      ch.chapter,
      String(ch.attempted),
      String(ch.correct),
      `${ch.accuracy}%`,
      ch.trend || 'stable'
    ]);
    drawTable(doc,
      ['Chapter', 'Attempted', 'Correct', 'Accuracy', 'Trend'],
      rows,
      [180, 70, 70, 70, 80]
    );
  }

  if (data.weak_chapters && data.weak_chapters.length > 0) {
    doc.moveDown(0.5);
    subsectionTitle(doc, 'Weak Chapters (Accuracy < 50%)');
    data.weak_chapters.slice(0, 5).forEach(ch => {
      bodyText(doc, `  • ${ch.chapter} — ${ch.accuracy}% accuracy`);
    });
  }

  if (data.strong_chapters && data.strong_chapters.length > 0) {
    subsectionTitle(doc, 'Strong Chapters (Accuracy > 75%)');
    data.strong_chapters.slice(0, 5).forEach(ch => {
      bodyText(doc, `  • ${ch.chapter} — ${ch.accuracy}% accuracy`);
    });
  }
}

/**
 * Report 5: Chapter Heatmap
 */
async function reportHeatmap(doc, userId) {
  const data = await analyticsService.getChapterHeatmap(userId);
  sectionTitle(doc, '5. Chapter Heatmap');
  if (!data || !data.heatmap || data.heatmap.length === 0) {
    bodyText(doc, 'No data available.'); return;
  }

  const rows = data.heatmap.map(h => [
    h.chapter,
    h.subject,
    String(h.attempted),
    `${h.accuracy}%`,
    '█'.repeat(Math.min(h.heat_level, 5)),
    h.insufficient_data ? 'Insufficient' : '—'
  ]);
  drawTable(doc,
    ['Chapter', 'Subject', 'Attempted', 'Accuracy', 'Level', 'Note'],
    rows,
    [150, 70, 65, 55, 55, 80]
  );

  subsectionTitle(doc, 'Legend');
  bodyText(doc, 'Level 1 (0-20%)  |  Level 2 (21-40%)  |  Level 3 (41-60%)  |  Level 4 (61-80%)  |  Level 5 (81-100%)');
}

/**
 * Report 6: Time Management Report
 */
async function reportTimeAnalysis(doc, userId) {
  const data = await analyticsService.getTimeAnalysis(userId);
  sectionTitle(doc, '6. Time Management Report');
  if (!data) { bodyText(doc, 'No data available.'); return; }

  bodyText(doc, `Average Time Per Question: ${data.avg_time_per_question_seconds || 0} seconds`);

  subsectionTitle(doc, 'By Subject');
  const sub = data.by_subject || {};
  drawTable(doc,
    ['Subject', 'Avg Time (s)', 'Fastest Chapter', 'Slowest Chapter'],
    [
      ['Physics', String(sub.physics?.avg_time || 0), sub.physics?.fastest_chapter || '-', sub.physics?.slowest_chapter || '-'],
      ['Chemistry', String(sub.chemistry?.avg_time || 0), sub.chemistry?.fastest_chapter || '-', sub.chemistry?.slowest_chapter || '-'],
      ['Maths', String(sub.maths?.avg_time || 0), sub.maths?.fastest_chapter || '-', sub.maths?.slowest_chapter || '-'],
    ],
    [90, 80, 150, 150]
  );

  subsectionTitle(doc, 'By Difficulty');
  const diff = data.by_difficulty || {};
  drawTable(doc,
    ['Difficulty', 'Avg Time (s)'],
    [
      ['Easy', `${diff.easy?.avg_time || 0}s`],
      ['Medium', `${diff.medium?.avg_time || 0}s`],
      ['Hard', `${diff.hard?.avg_time || 0}s`],
    ],
    [280, 180]
  );

  if (data.time_distribution) {
    subsectionTitle(doc, 'Time Distribution');
    drawTable(doc,
      ['Bucket', 'Count'],
      data.time_distribution.map(t => [t.bucket, String(t.count)]),
      [280, 180]
    );
  }

  if (data.slow_chapters && data.slow_chapters.length > 0) {
    subsectionTitle(doc, 'Slowest Chapters');
    data.slow_chapters.forEach(ch => bodyText(doc, `  • ${ch}`));
  }
}

/**
 * Report 7: Difficulty Analysis
 */
async function reportDifficulty(doc, userId) {
  const subjData = {};
  for (const sub of ['PHYSICS', 'CHEMISTRY', 'MATHS']) {
    try {
      subjData[sub] = await analyticsService.getSubjectBreakdown(userId, sub);
    } catch { subjData[sub] = null; }
  }
  sectionTitle(doc, '7. Difficulty-wise Performance');

  for (const sub of ['PHYSICS', 'CHEMISTRY', 'MATHS']) {
    const sd = subjData[sub];
    if (!sd || !sd.chapter_breakdown) continue;
    subsectionTitle(doc, sub);
    // Aggregate difficulty from chapter_breakdown
    let easy = { attempted: 0, correct: 0 };
    let medium = { attempted: 0, correct: 0 };
    let hard = { attempted: 0, correct: 0 };

    sd.chapter_breakdown.forEach(ch => {
      const d = ch.difficulty_breakdown || {};
      if (d.easy) { easy.attempted += d.easy.attempted; easy.correct += d.easy.correct; }
      if (d.medium) { medium.attempted += d.medium.attempted; medium.correct += d.medium.correct; }
      if (d.hard) { hard.attempted += d.hard.attempted; hard.correct += d.hard.correct; }
    });

    drawTable(doc,
      ['Difficulty', 'Attempted', 'Correct', 'Accuracy'],
      [
        ['Easy', String(easy.attempted), String(easy.correct), `${easy.attempted > 0 ? ((easy.correct/easy.attempted)*100).toFixed(1) : 0}%`],
        ['Medium', String(medium.attempted), String(medium.correct), `${medium.attempted > 0 ? ((medium.correct/medium.attempted)*100).toFixed(1) : 0}%`],
        ['Hard', String(hard.attempted), String(hard.correct), `${hard.attempted > 0 ? ((hard.correct/hard.attempted)*100).toFixed(1) : 0}%`],
      ],
      [100, 100, 100, 100]
    );
  }
}

/**
 * Report 8: Progress Tracker
 */
async function reportProgress(doc, userId) {
  const data = await analyticsService.getProgress(userId);
  sectionTitle(doc, '8. Progress Tracker');
  if (!data || !data.tests || data.tests.length === 0) {
    bodyText(doc, 'No data available.'); return;
  }

  subsectionTitle(doc, 'Score Trend');
  if (data.score_trend) {
    drawTable(doc,
      ['Date', 'Score', 'Max'],
      data.score_trend.map(s => [s.date, String(s.score), '300']),
      [180, 100, 100]
    );
  }

  subsectionTitle(doc, 'Recent Test Results');
  const rows = data.tests.slice(0, 15).map(t => [
    t.test_title?.substring(0, 28) || t.test_id?.substring(0, 8) || '',
    String(t.total_score),
    `${t.accuracy}%`,
    String(t.percentile)
  ]);
  drawTable(doc,
    ['Test', 'Score', 'Accuracy', 'Percentile'],
    rows,
    [170, 60, 70, 80]
  );

  if (data.tests.length > 15) {
    bodyText(doc, `... and ${data.tests.length - 15} more tests`);
  }
}

/**
 * Report 9: Test Comparison (vs Topper)
 */
async function reportComparison(doc, userId, testId, attemptId) {
  const data = await analyticsService.getTestComparison(userId, testId, attemptId);
  sectionTitle(doc, '9. Test Comparison Report');
  if (!data) { bodyText(doc, 'No comparison data available.'); return; }

  subsectionTitle(doc, 'Score Comparison');
  const s = data.student || {};
  const t = data.topper || {};
  drawTable(doc,
    ['Metric', 'You', 'Topper', 'Gap'],
    [
      ['Total Score', String(s.total_score || 0), String(t.total_score || 0), `${data.gap_analysis?.score_gap || 0}`],
      ['Physics', String(s.physics_score || 0), String(t.physics_score || 0), `${data.gap_analysis?.physics_gap || 0}`],
      ['Chemistry', String(s.chemistry_score || 0), String(t.chemistry_score || 0), `${data.gap_analysis?.chemistry_gap || 0}`],
      ['Maths', String(s.maths_score || 0), String(t.maths_score || 0), `${data.gap_analysis?.maths_gap || 0}`],
      ['Accuracy', `${s.accuracy || 0}%`, `${t.accuracy || 0}%`, `${((s.accuracy || 0) - (t.accuracy || 0)).toFixed(1)}%`],
    ],
    [120, 80, 80, 80]
  );

  if (data.gap_analysis?.weak_vs_topper && data.gap_analysis.weak_vs_topper.length > 0) {
    subsectionTitle(doc, 'Chapters to Improve (vs Topper)');
    data.gap_analysis.weak_vs_topper.forEach(w => {
      bodyText(doc, `  • ${w.chapter} — you: ${w.student_accuracy}%, topper: ${w.topper_accuracy}%`);
    });
  }
}

/**
 * Report 10: SWOT Analysis
 */
async function reportSwot(doc, userId) {
  const data = await analyticsService.getSwotReport(userId);
  sectionTitle(doc, '10. SWOT Analysis');
  if (!data) { bodyText(doc, 'No SWOT data available.'); return; }

  if (data.strengths && data.strengths.length > 0) {
    subsectionTitle(doc, 'Strengths');
    data.strengths.slice(0, 5).forEach(s => {
      bodyText(doc, `  ✓ ${s.label} (${s.subject}) — ${s.insight}`);
    });
  }

  if (data.weaknesses && data.weaknesses.length > 0) {
    subsectionTitle(doc, 'Weaknesses');
    data.weaknesses.slice(0, 5).forEach(w => {
      bodyText(doc, `  ✗ ${w.label} (${w.subject}) — ${w.insight}`);
    });
  }

  if (data.opportunities && data.opportunities.length > 0) {
    subsectionTitle(doc, 'Opportunities');
    data.opportunities.slice(0, 5).forEach(o => {
      bodyText(doc, `  ↑ ${o.label} — ${o.insight}`);
    });
  }

  if (data.threats && data.threats.length > 0) {
    subsectionTitle(doc, 'Threats');
    data.threats.forEach(t => {
      bodyText(doc, `  ! ${t.label} — ${t.insight}`);
    });
  }

  if (data.priority_action) {
    subsectionTitle(doc, 'Priority Action');
    bodyText(doc, data.priority_action, 10);
  }
}

/**
 * Report 11: Accuracy Analysis
 */
async function reportAccuracy(doc, userId) {
  sectionTitle(doc, '11. Accuracy Analysis');
  const subs = ['PHYSICS', 'CHEMISTRY', 'MATHS'];
  for (const sub of subs) {
    try {
      const data = await analyticsService.getSubjectBreakdown(userId, sub);
      if (!data || !data.chapter_breakdown) continue;
      subsectionTitle(doc, sub);
      const rows = data.chapter_breakdown.map(ch => [
        ch.chapter,
        String(ch.attempted),
        String(ch.correct),
        String(ch.incorrect),
        `${ch.accuracy}%`
      ]);
      drawTable(doc,
        ['Chapter', 'Attempted', 'Correct', 'Incorrect', 'Accuracy'],
        rows,
        [150, 60, 60, 60, 70]
      );
    } catch { /* no data */ }
  }
}

/**
 * Report 12: Speed Analysis
 */
async function reportSpeed(doc, userId) {
  const data = await analyticsService.getTimeAnalysis(userId);
  sectionTitle(doc, '12. Speed Analysis');
  if (!data) { bodyText(doc, 'No data available.'); return; }

  bodyText(doc, `Average Time Per Question: ${data.avg_time_per_question_seconds || 0}s`);

  if (data.by_subject) {
    subsectionTitle(doc, 'Speed by Subject');
    const s = data.by_subject;
    drawTable(doc,
      ['Subject', 'Avg Time (s)', 'Speed vs Target (90s)'],
      [
        ['Physics', `${s.physics?.avg_time || 0}s`, (s.physics?.avg_time || 0) <= 90 ? 'On Track' : 'Needs Improvement'],
        ['Chemistry', `${s.chemistry?.avg_time || 0}s`, (s.chemistry?.avg_time || 0) <= 90 ? 'On Track' : 'Needs Improvement'],
        ['Maths', `${s.maths?.avg_time || 0}s`, (s.maths?.avg_time || 0) <= 90 ? 'On Track' : 'Needs Improvement'],
      ],
      [160, 100, 150]
    );
  }

  if (data.slow_chapters && data.slow_chapters.length > 0) {
    subsectionTitle(doc, 'Areas to Speed Up');
    data.slow_chapters.forEach(ch => bodyText(doc, `  • ${ch}`));
  }
}

/**
 * Report 13: Score Projection
 */
async function reportProjection(doc, userId) {
  const data = await analyticsService.getProgress(userId);
  sectionTitle(doc, '13. Score Projection');
  if (!data || !data.tests || data.tests.length < 3) {
    bodyText(doc, 'Need at least 3 completed tests for projection.');
    return;
  }

  const scores = data.tests.map(t => t.total_score);
  const recent = scores.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const maxScore = Math.max(...recent);
  const minScore = Math.min(...recent);
  const trend = scores.length >= 3
    ? scores.slice(-3).reduce((a, b) => a + b, 0) / 3 - scores.slice(-6, -3).reduce((a, b) => a + b, 0) / 3
    : 0;

  bodyText(doc, `Recent Average (last 5): ${avg.toFixed(1)}/300`);
  bodyText(doc, `Highest Score: ${maxScore}/300`);
  bodyText(doc, `Lowest Score: ${minScore}/300`);
  bodyText(doc, `Current Trend: ${trend > 0 ? 'Improving (+' + trend.toFixed(1) + ')' : trend < 0 ? 'Declining (' + trend.toFixed(1) + ')' : 'Stable'}`);

  const projectedNext = Math.round(avg + trend);
  subsectionTitle(doc, 'Projected Next Test Score');
  bodyText(doc, `Projected Score: ${Math.min(300, Math.max(0, projectedNext))}/300`, 12);

  const projectedRank = 100 - (projectedNext / 300) * 100;
  bodyText(doc, `Estimated Percentile: ${Math.max(0, Math.round(100 - projectedRank))}th`);

  subsectionTitle(doc, 'Target Setting');
  bodyText(doc, `To reach 250/300: Need +${Math.max(0, 250 - projectedNext)} more marks`);
  bodyText(doc, `To reach 280/300: Need +${Math.max(0, 280 - projectedNext)} more marks`);
}

/**
 * Report 14: Weak Areas Report
 */
async function reportWeakAreas(doc, userId) {
  const swot = await analyticsService.getSwotReport(userId);
  sectionTitle(doc, '14. Weak Areas Report');
  if (!swot) { bodyText(doc, 'No data available.'); return; }

  if (swot.weaknesses && swot.weaknesses.length > 0) {
    subsectionTitle(doc, 'Critical Weaknesses (Accuracy < 50%)');
    swot.weaknesses.forEach(w => {
      bodyText(doc, `  • ${w.label} (${w.subject}) — ${w.accuracy}% accuracy`);
    });
  }

  const subs = ['PHYSICS', 'CHEMISTRY', 'MATHS'];
  for (const sub of subs) {
    try {
      const data = await analyticsService.getSubjectBreakdown(userId, sub);
      if (!data) continue;
      const weak = data.weak_chapters || [];
      if (weak.length === 0) continue;
      subsectionTitle(doc, `Weak ${sub} Chapters`);
      weak.forEach(ch => {
        bodyText(doc, `  • ${ch.chapter}: ${ch.accuracy}% accuracy (${ch.attempted} attempts)`);
      });
    } catch { /* skip */ }
  }

  subsectionTitle(doc, 'Improvement Plan');
  bodyText(doc, '1. Focus on weak chapters identified above');
  bodyText(doc, '2. Review mistakes and understand the concepts');
  bodyText(doc, '3. Practice with targeted chapter-wise exercises');
  bodyText(doc, '4. Take mock tests to track improvement');
  bodyText(doc, '5. Revise formulas and key concepts regularly');
}

/**
 * Report 15: Comprehensive Report
 */
async function reportComprehensive(doc, userId) {
  sectionTitle(doc, '15. Comprehensive Analytics Report');
  bodyText(doc, 'This report combines all key analytics into a single comprehensive overview.');

  await reportOverview(doc, userId);
  addPage(doc);

  for (const sub of ['PHYSICS', 'CHEMISTRY', 'MATHS']) {
    try {
      await reportSubject(doc, userId, sub);
      addPage(doc);
    } catch { /* skip */ }
  }

  try { await reportHeatmap(doc, userId); } catch { /* skip */ }
  addPage(doc);

  try { await reportTimeAnalysis(doc, userId); } catch { /* skip */ }
  addPage(doc);

  try { await reportDifficulty(doc, userId); } catch { /* skip */ }
  addPage(doc);

  try { await reportProgress(doc, userId); } catch { /* skip */ }
  addPage(doc);

  try { await reportSwot(doc, userId); } catch { /* skip */ }
}

// ─── Main Dispatch ──────────────────────────────────────────────

const REPORT_GENERATORS = {
  overview: reportOverview,
  physics: (doc, uid) => reportSubject(doc, uid, 'PHYSICS'),
  chemistry: (doc, uid) => reportSubject(doc, uid, 'CHEMISTRY'),
  maths: (doc, uid) => reportSubject(doc, uid, 'MATHS'),
  heatmap: reportHeatmap,
  'time-analysis': reportTimeAnalysis,
  difficulty: reportDifficulty,
  progress: reportProgress,
  comparison: reportComparison,
  swot: reportSwot,
  accuracy: reportAccuracy,
  speed: reportSpeed,
  projection: reportProjection,
  'weak-areas': reportWeakAreas,
  comprehensive: reportComprehensive,
};

export const REPORT_TYPES = Object.keys(REPORT_GENERATORS);

const REPORT_TITLES = {
  overview: 'Performance Overview',
  physics: 'Physics Chapter Analysis',
  chemistry: 'Chemistry Chapter Analysis',
  maths: 'Maths Chapter Analysis',
  heatmap: 'Chapter Heatmap',
  'time-analysis': 'Time Management Report',
  difficulty: 'Difficulty Analysis',
  progress: 'Progress Tracker',
  comparison: 'Test Comparison Report',
  swot: 'SWOT Analysis',
  accuracy: 'Accuracy Analysis',
  speed: 'Speed Analysis',
  projection: 'Score Projection',
  'weak-areas': 'Weak Areas Report',
  comprehensive: 'Comprehensive Full Report',
};

/**
 * Generate a PDF report as a Buffer.
 * @param {string} reportType - One of REPORT_TYPES
 * @param {string} userId
 * @param {object} options - { testId, attemptId } for comparison report
 * @returns {Promise<Buffer>}
 */
export async function generateReport(reportType, userId, options = {}) {
  const generator = REPORT_GENERATORS[reportType];
  if (!generator) {
    throw new Error(`Unknown report type: ${reportType}. Available: ${REPORT_TYPES.join(', ')}`);
  }

  const title = REPORT_TITLES[reportType] || 'Analytics Report';
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    info: {
      Title: title,
      Author: 'JEEmocks Analytics',
      Subject: 'JEE Performance Report',
    },
  });

  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  drawHeader(doc, title, 'JEEmocks Performance Report');
  drawFooter(doc, 1);

  if (reportType === 'comparison') {
    await generator(doc, userId, options.testId, options.attemptId);
  } else {
    await generator(doc, userId);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
  });
}
