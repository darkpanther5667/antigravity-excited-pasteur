import { sendError } from '../utils/response.js';
import { generateReport, REPORT_TYPES } from '../services/pdfGenerator.js';
import * as analyticsService from '../services/analyticsService.js';

const checkAttemptedUser = async (userId) => {
  try {
    await analyticsService.getOverview(userId);
  } catch (e) {
    return false;
  }
  return true;
};

export const downloadPdfReport = async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!REPORT_TYPES.includes(type)) {
      return sendError(res, `Invalid report type. Available: ${REPORT_TYPES.join(', ')}`, 400);
    }

    const userId = req.query.userId && ['TEACHER', 'ADMIN'].includes(req.user.role)
      ? req.query.userId
      : req.user.id;

    const hasAttempts = await checkAttemptedUser(userId);
    if (!hasAttempts) {
      return sendError(res, 'No submitted attempts found. Complete a test first.', 404);
    }

    const options = {};
    if (type === 'comparison') {
      if (!req.query.testId || !req.query.attemptId) {
        return sendError(res, 'testId and attemptId required for comparison report', 400);
      }
      options.testId = req.query.testId;
      options.attemptId = req.query.attemptId;
    }

    const pdfBuffer = await generateReport(type, userId, options);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="jeemocks-${type}-report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const listReports = async (req, res) => {
  const reports = REPORT_TYPES.map(type => ({
    type,
    title: type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    requiresComparison: type === 'comparison',
  }));
  return res.json({ success: true, data: reports });
};
