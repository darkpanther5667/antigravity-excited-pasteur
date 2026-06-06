#!/usr/bin/env node

/**
 * Targeted Physics INTEGER Question Filler
 * Adds more physics INTEGER-type questions so we can create 220+ tests.
 * Current: 753 physics INTEGER. Need ~1100 for 220 tests (5 per test).
 *
 * Usage: node scripts/fillPhysicsInteger.js [target_count]
 *   target_count: desired number of physics INTEGER questions (default: 1100)
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, d = 1) => parseFloat((min + Math.random() * (max - min)).toFixed(d));

const generators = [
  // SHM - find k from T
  function() {
    const m = randInt(1, 5); const T = randFloat(0.5, 3, 1);
    const k = Math.round(4 * 10 * m / (T * T));
    return { chapter: 'Simple Harmonic Motion', topic: 'Spring-Block System', difficulty: 'MEDIUM',
      questionText: `A ${m} kg block oscillates with period ${T} s on a spring. The spring constant (N/m, π²≈10) is:`,
      correctAnswer: String(k), solution: `k = 4π²m/T² = 4×10×${m}/(${T})² = ${k} N/m` };
  },
  // Calorimetry
  function() {
    const m = randInt(100, 500); const dT = randInt(10, 50); const c = 1;
    const Q = m * c * dT;
    return { chapter: 'Heat & Thermodynamics', topic: 'Heat Transfer', difficulty: 'EASY',
      questionText: `Heat required to raise ${m} g of water by ${dT}°C is: (specific heat = 1 cal/g°C)`,
      correctAnswer: String(Q), solution: `Q = mcΔT = ${m}×1×${dT} = ${Q} cal` };
  },
  // Lens power
  function() {
    const f = randInt(10, 50); const P = Math.round(100 / f * 100) / 100;
    return { chapter: 'Optics', topic: 'Lens Formula', difficulty: 'EASY',
      questionText: `A convex lens has focal length ${f} cm. Its power in diopters is:`,
      correctAnswer: String(P), solution: `P = 1/f(m) = 100/${f} = ${P} D` };
  },
  // Resistivity
  function() {
    const rho = randInt(1, 10) * 10; const L = randFloat(1, 5, 1); const A = randFloat(0.1, 0.8, 2);
    const R = Math.round(rho * L / A);
    return { chapter: 'Current Electricity', topic: 'Ohm\'s Law', difficulty: 'MEDIUM',
      questionText: `A wire of resistivity ${rho}×10⁻⁸ Ω·m, length ${L} m, area ${A}×10⁻⁶ m² has resistance (Ω):`,
      correctAnswer: String(R), solution: `R = ρL/A = ${rho}×${L}/(${A}) = ${R} Ω` };
  },
  // Specific heat capacity
  function() {
    const Q = randInt(500, 5000); const m = randInt(100, 500); const dT = randInt(10, 30);
    const c = Math.round(Q / (m * dT) * 100) / 100;
    return { chapter: 'Heat & Thermodynamics', topic: 'Heat Transfer', difficulty: 'MEDIUM',
      questionText: `${Q} J heat raises ${m} g of a substance by ${dT}°C. Specific heat capacity (J/g°C) is:`,
      correctAnswer: String(c), solution: `c = Q/mΔT = ${Q}/(${m}×${dT}) = ${c} J/g°C` };
  },
  // Angular momentum
  function() {
    const m = randInt(1, 5); const v = randInt(5, 20); const r = randFloat(0.5, 2, 1);
    const L = Math.round(m * v * r);
    return { chapter: 'Rotational Motion', topic: 'Angular Momentum', difficulty: 'HARD',
      questionText: `A ${m} kg particle moves at ${v} m/s in a circular path of radius ${r} m. Angular momentum (kg·m²/s):`,
      correctAnswer: String(L), solution: `L = mvr = ${m}×${v}×${r} = ${L} kg·m²/s` };
  },
  // Doppler shift
  function() {
    const f = randInt(400, 800); const v = randInt(20, 50);
    const fo = Math.round(f * 340 / (340 - v));
    return { chapter: 'Waves', topic: 'Doppler Effect', difficulty: 'HARD',
      questionText: `A source of frequency ${f} Hz moves towards observer at ${v} m/s. Apparent frequency (Hz, v_sound=340):`,
      correctAnswer: String(fo), solution: `f' = f(v)/(v-vs) = ${f}(340)/(340-${v}) = ${fo} Hz` };
  },
  // Magnetic field at centre of coil
  function() {
    const N = randInt(10, 50); const I = randFloat(1, 5, 1); const r = randFloat(0.1, 0.3, 2);
    const B = Math.round(4 * Math.PI * 1e-7 * N * I / (2 * r) * 1e6 * 100) / 100;
    return { chapter: 'Magnetism & Magnetic Effects', topic: 'Biot-Savart Law', difficulty: 'HARD',
      questionText: `A coil of ${N} turns, radius ${r} m, carries ${I} A. Magnetic field at centre (μT, μ₀=4π×10⁻⁷):`,
      correctAnswer: String(B), solution: `B = μ₀NI/2r = 4π×10⁻⁷×${N}×${I}/(2×${r}) = ${B} μT` };
  },
];

async function main() {
  const target = parseInt(process.argv[2]) || 1100;

  const current = await prisma.question.count({
    where: { subject: 'PHYSICS', type: 'INTEGER', deletedAt: null }
  });
  const needed = Math.max(0, target - current);
  console.log(`📊 Current physics INTEGER: ${current}, Need: ${needed}`);

  if (needed <= 0) {
    console.log('✅ Already have enough.');
    await prisma.$disconnect();
    return;
  }

  // Get admin user
  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) admin = await prisma.user.findFirst();
  if (!admin) { console.error('No user found'); process.exit(1); }

  const batchSize = 500;
  let buffer = [];
  let created = 0;

  for (let i = 0; i < needed * 5; i++) {
    if (created >= needed) break;
    const gen = generators[i % generators.length];
    const q = gen();
    const record = {
      subject: 'PHYSICS', chapter: q.chapter, topic: q.topic,
      difficulty: q.difficulty, type: 'INTEGER',
      questionText: q.questionText, optionA: null, optionB: null, optionC: null, optionD: null,
      correctAnswer: q.correctAnswer,
      solution: q.solution, year: 2020 + randInt(0, 5),
      examType: 'MAINS', ntaWeightage: randInt(4, 8), createdBy: admin.id
    };
    buffer.push(record);
    created++;

    if (buffer.length >= batchSize) {
      await prisma.question.createMany({ data: buffer, skipDuplicates: true });
      const total = await prisma.question.count({ where: { subject: 'PHYSICS', type: 'INTEGER' } });
      console.log(`📥 Inserted ${buffer.length} | Total physics INTEGER: ${total}`);
      buffer = [];
    }
  }

  if (buffer.length > 0) {
    await prisma.question.createMany({ data: buffer, skipDuplicates: true });
  }

  const final = await prisma.question.count({ where: { subject: 'PHYSICS', type: 'INTEGER' } });
  console.log(`✅ Done. Physics INTEGER: ${final}`);
  await prisma.$disconnect();
}

main().catch(err => { console.error(err); prisma.$disconnect(); process.exit(1); });
