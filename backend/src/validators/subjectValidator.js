import { z } from 'zod';

export const subjectSchema = z.enum(['PHYSICS', 'CHEMISTRY', 'MATHS']);
