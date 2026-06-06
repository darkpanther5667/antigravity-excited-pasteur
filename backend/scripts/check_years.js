import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();
const prisma = new PrismaClient();

const total = await prisma.question.count();
const withYear = await prisma.question.count({ where: { year: { not: null } } });
const withoutYear = await prisma.question.count({ where: { year: null } });
console.log('Total:', total);
console.log('With year:', withYear);
console.log('Without year:', withoutYear);

// Check a few of the oldest (first created) questions
const oldest = await prisma.question.findMany({ take: 3, orderBy: { createdAt: 'asc' } });
oldest.forEach(q => console.log('Oldest:', q.id, q.subject, q.type, 'year:', q.year, 'created:', q.createdAt.toISOString().slice(0,19)));

// Check a few of the newest (last created) questions
const newest = await prisma.question.findMany({ take: 3, orderBy: { createdAt: 'desc' } });
newest.forEach(q => console.log('Newest:', q.id, q.subject, q.type, 'year:', q.year, 'created:', q.createdAt.toISOString().slice(0,19)));

await prisma.$disconnect();
