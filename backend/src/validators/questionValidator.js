import { z } from 'zod';

export const questionSchema = z.object({
  subject: z.enum(['PHYSICS', 'CHEMISTRY', 'MATHS']),
  chapter: z.string().min(2).max(100),
  topic: z.string().min(2).max(100),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  type: z.enum(['SINGLE', 'MULTI', 'INTEGER', 'MATRIX']),
  question_text: z.string().min(10),
  option_a: z.string().optional().nullable(),
  option_b: z.string().optional().nullable(),
  option_c: z.string().optional().nullable(),
  option_d: z.string().optional().nullable(),
  correct_answer: z.string().min(1),
  solution: z.string().min(10),
  year: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number().int().min(2000).max(2025).optional().nullable()),
  exam_type: z.enum(['MAINS', 'ADVANCED']),
  nta_weightage: z.preprocess((val) => {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number().int().min(1).max(10))
}).superRefine((data, ctx) => {
  const { type, option_a, option_b, option_c, option_d, correct_answer } = data;

  // Rule 1: SINGLE, MULTI, MATRIX options must be present and non-empty
  if (['SINGLE', 'MULTI', 'MATRIX'].includes(type)) {
    if (!option_a || option_a.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'option_a is required for SINGLE, MULTI, and MATRIX types',
        path: ['option_a'],
      });
    }
    if (!option_b || option_b.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'option_b is required for SINGLE, MULTI, and MATRIX types',
        path: ['option_b'],
      });
    }
    if (!option_c || option_c.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'option_c is required for SINGLE, MULTI, and MATRIX types',
        path: ['option_c'],
      });
    }
    if (!option_d || option_d.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'option_d is required for SINGLE, MULTI, and MATRIX types',
        path: ['option_d'],
      });
    }
  }

  // Rule 2: INTEGER options must be null/empty
  if (type === 'INTEGER') {
    if (option_a && option_a.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INTEGER type must not have options',
        path: ['option_a'],
      });
    }
    if (option_b && option_b.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INTEGER type must not have options',
        path: ['option_b'],
      });
    }
    if (option_c && option_c.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INTEGER type must not have options',
        path: ['option_c'],
      });
    }
    if (option_d && option_d.trim() !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'INTEGER type must not have options',
        path: ['option_d'],
      });
    }
  }

  // Rule 3: correct_answer constraints
  if (type === 'SINGLE') {
    if (!['a', 'b', 'c', 'd'].includes(correct_answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correct_answer for SINGLE: must be exactly one of 'a', 'b', 'c', 'd'",
        path: ['correct_answer'],
      });
    }
  } else if (type === 'MULTI') {
    const parts = correct_answer.split(',').map(p => p.trim());
    const isValid = parts.length > 0 && parts.every(part => ['a', 'b', 'c', 'd'].includes(part));
    if (!isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correct_answer for MULTI: must be comma-separated subset of 'a,b,c,d'",
        path: ['correct_answer'],
      });
    }
  } else if (type === 'INTEGER') {
    const num = Number(correct_answer);
    if (isNaN(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correct_answer for INTEGER: must be a string that parses to a valid integer or decimal',
        path: ['correct_answer'],
      });
    }
  }
});
