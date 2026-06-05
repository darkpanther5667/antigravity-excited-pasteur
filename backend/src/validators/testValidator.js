import { z } from 'zod';

export const testSchema = z.object({
  title: z.string().min(3).max(200),
  type: z.enum(['FULL_MOCK', 'CHAPTER', 'PYQ', 'ADAPTIVE']),
  exam_type: z.enum(['MAINS', 'ADVANCED']),
  duration_minutes: z.number().int().min(10).max(360),
  total_marks: z.number().int().min(10).max(400),
  instructions: z.string().optional(),
  scheduled_at: z.string().datetime().optional().nullable()
});
