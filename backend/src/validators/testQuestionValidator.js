import { z } from 'zod';

export const testQuestionItemSchema = z.object({
  question_id: z.string().uuid(),
  section: z.enum(['PHYSICS', 'CHEMISTRY', 'MATHS']),
  marks_correct: z.number().int().min(1).max(10),
  marks_incorrect: z.number().min(-5).max(0),
  question_order: z.number().int().positive()
});

export const testQuestionsSchema = z.object({
  questions: z.array(testQuestionItemSchema).min(1)
});
