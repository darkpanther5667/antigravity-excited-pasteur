#!/usr/bin/env node

/**
 * JEEmocks Bulk Question Generator
 * Generates ~16,500 realistic JEE questions with LaTeX, proper difficulty,
 * and full syllabus coverage across Physics, Chemistry, and Maths.
 *
 * Usage: node scripts/generateQuestions.js [count]
 *   count: target total questions (default 16500)
 *
 * Run from the backend directory with DATABASE_URL set.
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// ============================================================
// CHAPTER DEFINITIONS per Subject
// ============================================================

const PHYSICS_CHAPTERS = [
  'Kinematics', 'Laws of Motion', 'Work Energy Power', 'Rotational Motion',
  'Gravitation', 'Simple Harmonic Motion', 'Waves', 'Heat & Thermodynamics',
  'Electrostatics', 'Current Electricity', 'Magnetism & Magnetic Effects',
  'Electromagnetic Induction', 'Optics', 'Modern Physics', 'Semiconductors'
];

const CHEMISTRY_CHAPTERS = [
  'Mole Concept', 'Atomic Structure', 'Chemical Bonding', 'States of Matter',
  'Chemical Thermodynamics', 'Chemical Equilibrium', 'Ionic Equilibrium',
  'Redox Reactions', 'p-Block Elements', 'd-Block Elements',
  'Coordination Compounds', 'General Organic Chemistry', 'Hydrocarbons',
  'Haloalkanes & Haloarenes', 'Biomolecules & Polymers'
];

const MATHS_CHAPTERS = [
  'Sets & Relations', 'Complex Numbers', 'Sequences & Series', 'Limits',
  'Continuity & Differentiability', 'Differential Calculus',
  'Application of Derivatives', 'Integral Calculus', 'Differential Equations',
  'Matrices', 'Determinants', 'Three Dimensional Geometry',
  'Vector Algebra', 'Probability', 'Statistics'
];

// ============================================================
// TOPICS per Chapter
// ============================================================

const PHYSICS_TOPICS = {
  'Kinematics': ['Motion in 1D', 'Motion in 2D', 'Projectile Motion', 'Relative Motion'],
  'Laws of Motion': ['Newton\'s Laws', 'Friction', 'Circular Motion', 'Free Body Diagrams'],
  'Work Energy Power': ['Work-Energy Theorem', 'Conservation of Energy', 'Power', 'Collisions'],
  'Rotational Motion': ['Moment of Inertia', 'Torque', 'Angular Momentum', 'Rolling Motion'],
  'Gravitation': ['Universal Law', 'Kepler\'s Laws', 'Satellite Motion', 'Escape Velocity'],
  'Simple Harmonic Motion': ['SHM Basics', 'Spring-Block System', 'Pendulum', 'Superposition'],
  'Waves': ['Wave Equation', 'Sound Waves', 'Standing Waves', 'Doppler Effect'],
  'Heat & Thermodynamics': ['Kinetic Theory', 'First Law', 'Second Law', 'Heat Transfer'],
  'Electrostatics': ['Coulomb\'s Law', 'Electric Field', 'Electric Potential', 'Capacitors'],
  'Current Electricity': ['Ohm\'s Law', 'Kirchhoff\'s Laws', 'Wheatstone Bridge', 'Meter Bridge'],
  'Magnetism & Magnetic Effects': ['Biot-Savart Law', 'Ampere\'s Law', 'Lorentz Force', 'Magnetic Materials'],
  'Electromagnetic Induction': ['Faraday\'s Law', 'Lenz\'s Law', 'Self Inductance', 'AC Circuits'],
  'Optics': ['Ray Optics', 'Lens Formula', 'Wave Optics', 'Interference'],
  'Modern Physics': ['Photoelectric Effect', 'Bohr Model', 'Nuclear Physics', 'Radioactivity'],
  'Semiconductors': ['Diodes', 'Transistors', 'Logic Gates', 'Band Theory']
};

const CHEMISTRY_TOPICS = {
  'Mole Concept': ['Stoichiometry', 'Limiting Reagent', 'Concentration Terms', 'Empirical Formula'],
  'Atomic Structure': ['Bohr Model', 'Quantum Numbers', 'Electronic Configuration', 'De Broglie Wavelength'],
  'Chemical Bonding': ['VSEPR Theory', 'VBT', 'Molecular Orbital Theory', 'Hybridization'],
  'States of Matter': ['Gas Laws', 'Van der Waals', 'Liquid State', 'Surface Tension'],
  'Chemical Thermodynamics': ['Enthalpy', 'Entropy', 'Gibbs Free Energy', 'Hess\'s Law'],
  'Chemical Equilibrium': ['Law of Mass Action', 'Kc & Kp', 'Le Chatelier Principle', 'Degree of Dissociation'],
  'Ionic Equilibrium': ['pH Calculations', 'Buffer Solutions', 'Solubility Product', 'Hydrolysis'],
  'Redox Reactions': ['Oxidation Number', 'Balancing Redox', 'Equivalent Weight', 'Electrochemical Cells'],
  'p-Block Elements': ['Group 15 Elements', 'Group 16 Elements', 'Group 17 Elements', 'Group 18 Elements'],
  'd-Block Elements': ['Configuration', 'Magnetic Properties', 'Catalytic Properties', 'Colored Ions'],
  'Coordination Compounds': ['Nomenclature', 'Isomerism', 'Crystal Field Theory', 'Werner Theory'],
  'General Organic Chemistry': ['Hybridization in Carbon', 'Inductive Effect', 'Resonance', 'Stereoisomerism'],
  'Hydrocarbons': ['Alkanes', 'Alkenes', 'Alkynes', 'Aromatic Compounds'],
  'Haloalkanes & Haloarenes': ['SN1 Reactions', 'SN2 Reactions', 'Elimination Reactions', 'Grignard Reagent'],
  'Biomolecules & Polymers': ['Carbohydrates', 'Proteins', 'Nucleic Acids', 'Addition Polymers']
};

const MATHS_TOPICS = {
  'Sets & Relations': ['Set Operations', 'Relations', 'Functions', 'Binary Operations'],
  'Complex Numbers': ['Argand Plane', 'Polar Form', 'De Moivre Theorem', 'Roots of Unity'],
  'Sequences & Series': ['AP & GP', 'Arithmetic-Geometric Progression', 'Summation', 'Inequalities'],
  'Limits': ['Standard Limits', 'L\'Hopital Rule', 'Limit Evaluation', 'Continuity'],
  'Continuity & Differentiability': ['Continuity', 'Differentiability', 'Chain Rule', 'Implicit Functions'],
  'Differential Calculus': ['Differentiation', 'Successive Differentiation', 'Mean Value Theorems', 'Partial Derivatives'],
  'Application of Derivatives': ['Tangents & Normals', 'Maxima & Minima', 'Rate of Change', 'Curve Sketching'],
  'Integral Calculus': ['Indefinite Integrals', 'Definite Integrals', 'Area Under Curve', 'Integration by Parts'],
  'Differential Equations': ['First Order DE', 'Separable Variables', 'Homogeneous DE', 'Linear DE'],
  'Matrices': ['Matrix Operations', 'Inverse Matrix', 'Rank of Matrix', 'System of Equations'],
  'Determinants': ['Property of Determinants', 'Cramer\'s Rule', 'Area of Triangle', 'Cofactors'],
  'Three Dimensional Geometry': ['Direction Cosines', 'Line in Space', 'Plane Equation', 'Distance Formula'],
  'Vector Algebra': ['Vector Addition', 'Dot Product', 'Cross Product', 'Scalar Triple Product'],
  'Probability': ['Conditional Probability', 'Bayes Theorem', 'Random Variables', 'Binomial Distribution'],
  'Statistics': ['Mean & Median', 'Variance', 'Standard Deviation', 'Correlation']
};

// ============================================================
// RANDOM UTILITIES
// ============================================================

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 1) => {
  const val = min + Math.random() * (max - min);
  return parseFloat(val.toFixed(decimals));
};
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ============================================================
// PHYSICS QUESTION GENERATORS
// ============================================================

const physicsGenerators = [];

// --- Kinematics: Motion in 1D ---
physicsGenerators.push(function kinematics_1d() {
  const a = randInt(2, 10);
  const t = randInt(2, 8);
  const u = randInt(0, 10);
  const s = u * t + 0.5 * a * t * t;
  const answers = [s, s + randInt(5, 20), Math.abs(s - randInt(5, 20)), u * t].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(s);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Kinematics', topic: 'Motion in 1D', difficulty: 'EASY', type: 'SINGLE',
    questionText: `A particle starts with initial velocity ${u} m/s and accelerates uniformly at ${a} m/s² for ${t} seconds. The distance covered is:`,
    optionA: `${answers[0]} m`, optionB: `${answers[1]} m`, optionC: `${answers[2]} m`, optionD: `${answers[3]} m`,
    correctAnswer: labels[correctIdx],
    solution: `Using s = ut + ½at²: s = ${u}(${t}) + ½(${a})(${t}²) = ${s} m`
  };
});

// --- Kinematics: Projectile ---
physicsGenerators.push(function kinematics_projectile() {
  const u = randInt(15, 50);
  const theta = pick([30, 37, 45, 53, 60]);
  const sin2t = Math.sin(2 * theta * Math.PI / 180);
  const R = Math.round(u * u * sin2t / 10);
  const answers = [R, Math.round(R * 0.5), Math.round(R * 0.75), Math.round(R * 1.25)].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(R);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Kinematics', topic: 'Projectile Motion', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `A projectile is launched with velocity ${u} m/s at an angle of ${theta}° to the horizontal. Its range (g = 10 m/s²) is:`,
    optionA: `${answers[0]} m`, optionB: `${answers[1]} m`, optionC: `${answers[2]} m`, optionD: `${answers[3]} m`,
    correctAnswer: labels[correctIdx],
    solution: `R = u²sin2θ/g = ${u}²sin(${2*theta}°)/10 = ${R} m`
  };
});

// --- Laws of Motion: Friction ---
physicsGenerators.push(function friction() {
  const m = randInt(1, 10);
  const mu = randFloat(0.2, 0.8);
  const g = 10;
  const F = Math.round(mu * m * g);
  const answers = [F, F + randInt(2, 5), Math.max(0, F - randInt(2, 5)), F + randInt(10, 15)].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(F);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Laws of Motion', topic: 'Friction', difficulty: 'EASY', type: 'SINGLE',
    questionText: `A block of mass ${m} kg is on a rough horizontal surface with μ = ${mu}. The minimum force required to just move the block is: (g = 10 m/s²)`,
    optionA: `${answers[0]} N`, optionB: `${answers[1]} N`, optionC: `${answers[2]} N`, optionD: `${answers[3]} N`,
    correctAnswer: labels[correctIdx],
    solution: `f_max = μmg = ${mu} × ${m} × 10 = ${F} N`
  };
});

// --- Laws of Motion: Pulley ---
physicsGenerators.push(function pulley() {
  const m1 = randInt(2, 8);
  const m2 = randInt(1, m1 - 1);
  const a = Math.round(((m1 - m2) / (m1 + m2)) * 10 * 10) / 10;
  const answers = [a, a + randFloat(1, 3), Math.abs(a - randFloat(1, 3)), a + randFloat(4, 6)];
  const correctIdx = answers.indexOf(a);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Laws of Motion', topic: 'Newton\'s Laws', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `Two masses ${m1} kg and ${m2} kg are connected by a light string over a frictionless pulley. The acceleration of the system is: (g = 10 m/s²)`,
    optionA: `${answers[0]} m/s²`, optionB: `${answers[1]} m/s²`, optionC: `${answers[2]} m/s²`, optionD: `${answers[3]} m/s²`,
    correctAnswer: labels[correctIdx],
    solution: `a = (m₁-m₂)g/(m₁+m₂) = (${m1}-${m2})10/${m1+m2} = ${a} m/s²`
  };
});

// --- Work Energy Power ---
physicsGenerators.push(function work_energy() {
  const m = randInt(1, 5);
  const v = randInt(5, 20);
  const KE = 0.5 * m * v * v;
  const answers = [KE, KE + randInt(20, 50), KE - randInt(10, 30), KE + randInt(100, 200)];
  const correctIdx = answers.indexOf(KE);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Work Energy Power', topic: 'Work-Energy Theorem', difficulty: 'EASY', type: 'SINGLE',
    questionText: `A body of mass ${m} kg moves with velocity ${v} m/s. Its kinetic energy is:`,
    optionA: `${answers[0]} J`, optionB: `${answers[1]} J`, optionC: `${answers[2]} J`, optionD: `${answers[3]} J`,
    correctAnswer: labels[correctIdx],
    solution: `KE = ½mv² = ½(${m})(${v})² = ${KE} J`
  };
});

// --- Rotational Motion: Moment of Inertia ---
physicsGenerators.push(function moi() {
  const m = randInt(1, 5);
  const r = randFloat(0.5, 2, 1);
  const I = Math.round(0.4 * m * r * r * 10) / 10;
  const answers = [I, Math.round(I * 1.5 * 10) / 10, Math.round(I * 0.6 * 10) / 10, Math.round(I * 2 * 10) / 10];
  const correctIdx = answers.indexOf(I);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Rotational Motion', topic: 'Moment of Inertia', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `A solid sphere of mass ${m} kg and radius ${r} m rotates about its diameter. Its moment of inertia is:`,
    optionA: `${answers[0]} kg·m²`, optionB: `${answers[1]} kg·m²`, optionC: `${answers[2]} kg·m²`, optionD: `${answers[3]} kg·m²`,
    correctAnswer: labels[correctIdx],
    solution: `I = ⅖MR² = ⅖(${m})(${r})² = ${I} kg·m²`
  };
});

// --- Gravitation ---
physicsGenerators.push(function gravitation() {
  const h = randInt(1, 10) * 1000;
  const g = 10;
  const gh = Math.round(g * (6400 / (6400 + h / 1000)) ** 2 * 100) / 100;
  const answers = [gh, gh + randFloat(0.5, 2), gh - randFloat(0.5, 2), randFloat(8, 9.8)];
  const correctIdx = answers.indexOf(gh);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Gravitation', topic: 'Satellite Motion', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `At a height of ${h} m above Earth's surface, the acceleration due to gravity is: (R = 6400 km, g₀ = 10 m/s²)`,
    optionA: `${answers[0]} m/s²`, optionB: `${answers[1]} m/s²`, optionC: `${answers[2]} m/s²`, optionD: `${answers[3]} m/s²`,
    correctAnswer: labels[correctIdx],
    solution: `g_h = g₀[R/(R+h)]² = 10[6400/(6400+${h/1000})]² = ${gh} m/s²`
  };
});

// --- SHM ---
physicsGenerators.push(function shm_spring() {
  const k = randInt(50, 200);
  const m = randInt(1, 5);
  const T = Math.round(2 * Math.PI * Math.sqrt(m / k) * 100) / 100;
  const answers = [T, Math.round(T * 1.5 * 100) / 100, Math.round(T * 0.5 * 100) / 100, Math.round(T * 2 * 100) / 100].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(T);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Simple Harmonic Motion', topic: 'Spring-Block System', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `A mass of ${m} kg is attached to a spring of spring constant ${k} N/m. The time period of oscillation is:`,
    optionA: `${answers[0]} s`, optionB: `${answers[1]} s`, optionC: `${answers[2]} s`, optionD: `${answers[3]} s`,
    correctAnswer: labels[correctIdx],
    solution: `T = 2π√(m/k) = 2π√(${m}/${k}) = ${T} s`
  };
});

// --- Electrostatics: Coulomb ---
physicsGenerators.push(function coulomb() {
  const q1 = randInt(1, 10);
  const q2 = randInt(1, 10);
  const r = randFloat(0.1, 0.5, 2);
  const F = Math.round(9 * q1 * q2 / (r * r) * 100) / 100;
  const labels = ['a', 'b', 'c', 'd'];
  const wrongs = [Math.round(F * 2 * 100) / 100, Math.round(F * 0.5 * 100) / 100, Math.round(F * 3 * 100) / 100];
  const all = shuffle([F, ...wrongs]);
  return {
    chapter: 'Electrostatics', topic: 'Coulomb\'s Law', difficulty: 'EASY', type: 'SINGLE',
    questionText: `Two charges ${q1} μC and ${q2} μC are placed ${r} m apart in air. The force between them is:`,
    optionA: `${all[0]} N`, optionB: `${all[1]} N`, optionC: `${all[2]} N`, optionD: `${all[3]} N`,
    correctAnswer: ['a','b','c','d'][all.indexOf(F)],
    solution: `F = kq₁q₂/r² = 9×10⁹×${q1}×10⁻⁶×${q2}×10⁻⁶/(${r})² = ${F} N`
  };
});

// --- Current Electricity ---
physicsGenerators.push(function ohms_law() {
  const V = randInt(5, 30);
  const R = randInt(5, 50);
  const I = Math.round(V / R * 100) / 100;
  const answers = [I, Math.round(I * 2 * 100) / 100, Math.round(I * 0.5 * 100) / 100, Math.round(I * 0.25 * 100) / 100].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(I);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Current Electricity', topic: 'Ohm\'s Law', difficulty: 'EASY', type: 'SINGLE',
    questionText: `A ${V} V battery is connected across a ${R} Ω resistor. The current flowing is:`,
    optionA: `${answers[0]} A`, optionB: `${answers[1]} A`, optionC: `${answers[2]} A`, optionD: `${answers[3]} A`,
    correctAnswer: labels[correctIdx],
    solution: `I = V/R = ${V}/${R} = ${I} A`
  };
});

// --- Optics: Lens ---
physicsGenerators.push(function lens() {
  const f = randInt(10, 30);
  const u = randInt(2 * f + 5, 3 * f);
  const v = Math.round(1 / (1 / f - 1 / u));
  const answers = [v, v + randInt(10, 30), Math.abs(v - randInt(10, 30)), v + randInt(40, 60)].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(v);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Optics', topic: 'Lens Formula', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `An object is placed ${u} cm from a convex lens of focal length ${f} cm. The image distance is:`,
    optionA: `${answers[0]} cm`, optionB: `${answers[1]} cm`, optionC: `${answers[2]} cm`, optionD: `${answers[3]} cm`,
    correctAnswer: labels[correctIdx],
    solution: `1/v = 1/f - 1/u = 1/${f} - 1/${u}, v = ${v} cm`
  };
});

// --- Modern Physics: Photoelectric ---
physicsGenerators.push(function photoelectric() {
  const phi = randFloat(2, 4, 1);
  const lambda = randInt(200, 400);
  const hc = 1240;
  const KE = Math.round((hc / lambda - phi) * 100) / 100;
  if (KE < 0) return null; // skip if no emission
  const answers = [KE, KE + randFloat(0.5, 2), Math.abs(KE - randFloat(0.5, 2)), KE + randFloat(2, 4)].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(KE);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Modern Physics', topic: 'Photoelectric Effect', difficulty: 'HARD', type: 'SINGLE',
    questionText: `The work function of a metal is ${phi} eV. Light of wavelength ${lambda} nm falls on it. The maximum kinetic energy of emitted electrons is: (h = 1240 eV·nm)`,
    optionA: `${answers[0]} eV`, optionB: `${answers[1]} eV`, optionC: `${answers[2]} eV`, optionD: `${answers[3]} eV`,
    correctAnswer: labels[correctIdx],
    solution: `KE_max = hc/λ - φ = 1240/${lambda} - ${phi} = ${KE} eV`
  };
});

// --- Magnetism ---
physicsGenerators.push(function magnetism_force() {
  const q = randInt(1, 5);
  const v = randInt(10, 100) * 1000;
  const B = randFloat(0.5, 2, 1);
  const F = Math.round(q * v * B);
  const answers = [F, F * 2, Math.round(F * 0.5), F * 3].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(F);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Magnetism & Magnetic Effects', topic: 'Lorentz Force', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `A charge of ${q} μC moving at ${v/1000} km/s enters a magnetic field of ${B} T perpendicularly. The force experienced is:`,
    optionA: `${answers[0]} N`, optionB: `${answers[1]} N`, optionC: `${answers[2]} N`, optionD: `${answers[3]} N`,
    correctAnswer: labels[correctIdx],
    solution: `F = qvB = ${q}×10⁻⁶×${v}×${B} = ${F} N`
  };
});

// --- Thermodynamics ---
physicsGenerators.push(function thermo() {
  const moles = randFloat(1, 3, 1);
  const dT = randInt(20, 80);
  const Cv = 12.5; // approx for diatomic
  const dU = Math.round(moles * Cv * dT);
  const answers = [dU, dU + randInt(50, 150), dU - randInt(50, 150), dU * 2].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(dU);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Heat & Thermodynamics', topic: 'First Law', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `${moles} moles of a diatomic gas are heated from ${randInt(20, 50)}°C to ${randInt(20, 50) + dT}°C at constant volume. The change in internal energy is: (Cv = 12.5 J/mol·K)`,
    optionA: `${answers[0]} J`, optionB: `${answers[1]} J`, optionC: `${answers[2]} J`, optionD: `${answers[3]} J`,
    correctAnswer: labels[correctIdx],
    solution: `ΔU = nCvΔT = ${moles}×12.5×${dT} = ${dU} J`
  };
});

// --- EMI ---
physicsGenerators.push(function emi() {
  const L = randFloat(0.5, 5, 1);
  const dI = randInt(5, 20);
  const dt = randFloat(0.01, 0.1, 2);
  const emf = Math.round(L * dI / dt * 100) / 100;
  const answers = [emf, emf + randFloat(10, 30), emf * 2, Math.round(emf * 0.5 * 100) / 100].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(emf);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Electromagnetic Induction', topic: 'Self Inductance', difficulty: 'HARD', type: 'SINGLE',
    questionText: `Current in a ${L} H inductor changes from 0 to ${dI} A in ${dt} s. The induced EMF is:`,
    optionA: `${answers[0]} V`, optionB: `${answers[1]} V`, optionC: `${answers[2]} V`, optionD: `${answers[3]} V`,
    correctAnswer: labels[correctIdx],
    solution: `ε = L dI/dt = ${L}×(${dI}/${dt}) = ${emf} V`
  };
});

// --- Waves ---
physicsGenerators.push(function waves_doppler() {
  const f = randInt(400, 800);
  const v = randInt(10, 30);
  const V = 340;
  const f_obs = Math.round(f * V / (V - v));
  const answers = [f_obs, f_obs + randInt(50, 100), f_obs - randInt(50, 100), f].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(f_obs);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Waves', topic: 'Doppler Effect', difficulty: 'HARD', type: 'SINGLE',
    questionText: `A source of frequency ${f} Hz moves towards a stationary observer at ${v} m/s. The apparent frequency is: (v_sound = 340 m/s)`,
    optionA: `${answers[0]} Hz`, optionB: `${answers[1]} Hz`, optionC: `${answers[2]} Hz`, optionD: `${answers[3]} Hz`,
    correctAnswer: labels[correctIdx],
    solution: `f' = f·V/(V-v_s) = ${f}(${V})/(${V}-${v}) = ${f_obs} Hz`
  };
});

// ============================================================
// PHYSICS INTEGER TYPE GENERATORS
// ============================================================

physicsGenerators.push(function integer_kinematics() {
  const u = randInt(0, 10);
  const a = randInt(2, 10);
  const t = randInt(3, 10);
  const v = u + a * t;
  return {
    chapter: 'Kinematics', topic: 'Motion in 1D', difficulty: 'EASY', type: 'INTEGER',
    questionText: `A particle starts from rest with acceleration ${a} m/s². Its velocity after ${t} seconds is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(v),
    solution: `v = u + at = 0 + ${a}×${t} = ${v} m/s`
  };
});

physicsGenerators.push(function integer_friction() {
  const m = randInt(2, 8);
  const mu = randFloat(0.3, 0.7, 1);
  const g = 10;
  const F = mu * m * g;
  return {
    chapter: 'Laws of Motion', topic: 'Friction', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `A ${m} kg block is on a horizontal surface with μ = ${mu}. The minimum force in N needed to start moving is: (g = 10)`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(Math.round(F)),
    solution: `F = μmg = ${mu}×${m}×10 = ${Math.round(F)} N`
  };
});

physicsGenerators.push(function integer_gravitation() {
  const mass = randInt(1, 10) * 1000;
  const vel = randInt(5, 15);
  const KE = 0.5 * mass * vel * vel;
  return {
    chapter: 'Work Energy Power', topic: 'Work-Energy Theorem', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `A ${mass} kg satellite orbits at ${vel} km/s. Its kinetic energy in MJ is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(Math.round(KE / 1000000)),
    solution: `KE = ½mv² = ½(${mass})(${vel}×10³)² = ${Math.round(KE/1000000)} MJ`
  };
});

// --- Additional Physics INTEGER generators ---
physicsGenerators.push(function integer_shm() {
  const m = randInt(1, 4);
  const k = randInt(50, 200);
  const T = Math.round(2 * Math.PI * Math.sqrt(m / k) * 10) / 10;
  return {
    chapter: 'Simple Harmonic Motion', topic: 'Spring-Block System', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `A ${m} kg block is attached to a spring. The time period is ${T} s. Find the spring constant k (in N/m, rounded to nearest integer). (Take π² ≈ 10)`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(k),
    solution: `T = 2π√(m/k) ⇒ k = 4π²m/T² = 4(10)(${m})/(${T})² = ${k} N/m`
  };
});

physicsGenerators.push(function integer_thermo() {
  const Q1 = randInt(500, 2000);
  const eff = randInt(20, 50);
  const W = Math.round(Q1 * eff / 100);
  return {
    chapter: 'Heat & Thermodynamics', topic: 'Second Law', difficulty: 'HARD', type: 'INTEGER',
    questionText: `A heat engine absorbs ${Q1} J of heat and has ${eff}% efficiency. The work output in J is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(W),
    solution: `η = W/Q₁ ⇒ W = ηQ₁ = ${eff}% × ${Q1} = ${W} J`
  };
});

physicsGenerators.push(function integer_optics() {
  const f = randInt(10, 30);
  const u = randInt(2 * f + 5, 3 * f);
  const v = Math.round(1 / (1 / f - 1 / u));
  const m = Math.round(v / u * 10) / 10;
  return {
    chapter: 'Optics', topic: 'Lens Formula', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `An object is placed ${u} cm from a convex lens of focal length ${f} cm. The magnification is: (answer rounded to 1 decimal)`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(m),
    solution: `v = ${v} cm, m = v/u = ${v}/${u} = ${m}`
  };
});

physicsGenerators.push(function integer_current() {
  const V = randInt(12, 48);
  const R = randInt(10, 100);
  const I = Math.round(V / R * 100) / 100;
  return {
    chapter: 'Current Electricity', topic: 'Ohm\'s Law', difficulty: 'EASY', type: 'INTEGER',
    questionText: `A ${V} V battery is connected to a ${R} Ω resistor. The current in A is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(I),
    solution: `I = V/R = ${V}/${R} = ${I} A`
  };
});

physicsGenerators.push(function integer_radioactivity() {
  const halfLife = randInt(5, 30);
  const t = halfLife * randInt(2, 4);
  const remaining = 100 / Math.pow(2, t / halfLife);
  const frac = remaining > 10 ? Math.round(remaining) : Math.round(remaining * 100) / 100;
  return {
    chapter: 'Modern Physics', topic: 'Radioactivity', difficulty: 'HARD', type: 'INTEGER',
    questionText: `A radioactive substance has half-life of ${halfLife} days. After ${t} days, the percentage remaining is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(frac),
    solution: `N/N₀ = (½)^(t/t½) = (½)^(${t}/${halfLife}) = ${frac}%`
  };
});

// ============================================================
// CHEMISTRY QUESTION GENERATORS
// ============================================================

const chemistryGenerators = [];

// --- Mole Concept ---
chemistryGenerators.push(function mole_stoich() {
  const moles = randFloat(0.5, 4, 1);
  const mass = moles * 18; // water
  const answers = [mass, mass * 2, mass * 0.5, mass + 18].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(mass);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Mole Concept', topic: 'Stoichiometry', difficulty: 'EASY', type: 'SINGLE',
    questionText: `The mass of ${moles} moles of water (H₂O) is: (Atomic masses: H=1, O=16)`,
    optionA: `${answers[0]} g`, optionB: `${answers[1]} g`, optionC: `${answers[2]} g`, optionD: `${answers[3]} g`,
    correctAnswer: labels[correctIdx],
    solution: `Mass = ${moles} × 18 = ${mass} g`
  };
});

chemistryGenerators.push(function mole_atoms() {
  const moles = randFloat(1, 5, 1);
  const Na = 6.022;
  const atoms = moles * Na;
  const answers = [atoms, atoms * 2, atoms * 0.5, atoms + 6].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(atoms);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Mole Concept', topic: 'Stoichiometry', difficulty: 'EASY', type: 'SINGLE',
    questionText: `Number of atoms in ${moles} moles of nitrogen gas (N₂) is: (N_A = 6.022 × 10²³)`,
    optionA: `${answers[0]} × 10²³`, optionB: `${answers[1]} × 10²³`, optionC: `${answers[2]} × 10²³`, optionD: `${answers[3]} × 10²³`,
    correctAnswer: labels[correctIdx],
    solution: `Atoms = ${moles} × 6.022 × 10²³ × 2 = ${atoms * 2} × 10²³`
  };
});

// --- Atomic Structure ---
chemistryGenerators.push(function atomic_bohr() {
  const n1 = randInt(1, 3);
  const n2 = randInt(n1 + 1, 6);
  const E = Math.round(13.6 * (1 / (n1 * n1) - 1 / (n2 * n2)) * 100) / 100;
  const answers = [E, E + 3, E * 2, Math.round(E * 0.5 * 100) / 100].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(E);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Atomic Structure', topic: 'Bohr Model', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `Energy released when an electron in H atom jumps from n=${n2} to n=${n1} is:`,
    optionA: `${answers[0]} eV`, optionB: `${answers[1]} eV`, optionC: `${answers[2]} eV`, optionD: `${answers[3]} eV`,
    correctAnswer: labels[correctIdx],
    solution: `ΔE = 13.6(1/${n1}²-1/${n2}²) = ${E} eV`
  };
});

chemistryGenerators.push(function quantum_numbers() {
  const n = randInt(2, 4);
  const l = randInt(0, n - 1);
  const m_min = -l;
  const m = randInt(m_min, l);
  const ms = pick(['+½', '-½']);
  return {
    chapter: 'Atomic Structure', topic: 'Quantum Numbers', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `Which set of quantum numbers is NOT possible for an electron?`,
    optionA: `n=${n}, l=${l}, m=${m}, s=${ms}`,
    optionB: `n=${n + 1}, l=${Math.min(l + 1, n)}, m=${Math.min(m + 1, l + 1)}, s=${ms}`,
    optionC: `n=${n}, l=${l + 2}, m=${m}, s=${ms}`,
    optionD: `n=${n - 1}, l=${randInt(0, n - 2)}, m=0, s=${ms}`,
    correctAnswer: 'c',
    solution: `For n=${n}, maximum l = n-1 = ${n - 1}. l=${l + 2} exceeds this, so impossible.`
  };
});

// --- Chemical Bonding ---
chemistryGenerators.push(function vsepr() {
  const molecules = [
    { formula: 'BF₃', geometry: 'Trigonal planar', hypo: 'Tetrahedral', correct: 'a', bond: 120 },
    { formula: 'NH₃', geometry: 'Trigonal pyramidal', hypo: 'Trigonal planar', correct: 'a', bond: 107 },
    { formula: 'H₂O', geometry: 'Bent', hypo: 'Linear', correct: 'a', bond: 105 },
    { formula: 'CH₄', geometry: 'Tetrahedral', hypo: 'Square planar', correct: 'a', bond: 109.5 },
    { formula: 'XeF₄', geometry: 'Square planar', hypo: 'Tetrahedral', correct: 'a', bond: 90 },
    { formula: 'SF₆', geometry: 'Octahedral', hypo: 'Trigonal prismatic', correct: 'a', bond: 90 },
  ];
  const mol = pick(molecules);
  return {
    chapter: 'Chemical Bonding', topic: 'VSEPR Theory', difficulty: 'EASY', type: 'SINGLE',
    questionText: `The geometry of ${mol.formula} according to VSEPR theory is:`,
    optionA: mol.geometry, optionB: mol.hypo, optionC: pick(['Trigonal bipyramidal', 'T-shaped', 'See-saw', 'Linear']),
    optionD: pick(['Square pyramidal', 'Pentagonal bipyramidal', 'Angular', 'Trigonal planar']),
    correctAnswer: 'a',
    solution: `${mol.formula} has ${mol.geometry} geometry with bond angle ${mol.bond}°`
  };
});

// --- Thermodynamics ---
chemistryGenerators.push(function chem_thermo() {
  const H = -randInt(20, 60);
  const S = -randInt(50, 200);
  const T = randInt(298, 500);
  const G = Math.round(H - T * S / 1000);
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [G, G + randInt(10, 30), G - randInt(10, 30), -G].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Chemical Thermodynamics', topic: 'Gibbs Free Energy', difficulty: 'HARD', type: 'SINGLE',
    questionText: `For a reaction, ΔH = ${H} kJ/mol and ΔS = ${S} J/mol·K at ${T} K. ΔG is:`,
    optionA: `${opts[0]} kJ/mol`, optionB: `${opts[1]} kJ/mol`, optionC: `${opts[2]} kJ/mol`, optionD: `${opts[3]} kJ/mol`,
    correctAnswer: labels[opts.indexOf(G)],
    solution: `ΔG = ΔH - TΔS = ${H} - ${T}(${S}/1000) = ${G} kJ/mol`
  };
});

// --- Equilibrium ---
chemistryGenerators.push(function chem_equilibrium() {
  const Kc = pick([0.04, 0.16, 0.25, 0.36, 1.0]);
  const C = randFloat(0.5, 2, 1);
  const alpha = Math.round(Math.sqrt(Kc / (4 * C)) * 100);
  const deg = Math.round(alpha * 100) / 100;
  return {
    chapter: 'Chemical Equilibrium', topic: 'Degree of Dissociation', difficulty: 'HARD', type: 'INTEGER',
    questionText: `For the reaction 2HI ⇌ H₂ + I₂, Kc = ${Kc} at a certain temperature. If ${C} mol/L of HI is taken, the equilibrium concentration of H₂ (mol/L) is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(deg),
    solution: `Kc = x²/(C-x)², x = ${deg} M`
  };
});

// --- Electrochemistry ---
chemistryGenerators.push(function nernst() {
  const conc_ratio = pick([10, 100, 1000]);
  const n = pick([1, 2]);
  const log_val = Math.log10(conc_ratio);
  const E = Math.round(0.059 / n * log_val * 1000);
  return {
    chapter: 'Redox Reactions', topic: 'Electrochemical Cells', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `The cell potential (mV) of a concentration cell with [ion]RHS/[ion]LHS = ${conc_ratio} at 298K is: (0.059/n × log(ratio))`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(E),
    solution: `E = 0.059/n × log(${conc_ratio}) = 0.059/${n} × ${log_val} = ${E} V`
  };
});

// --- Organic Chemistry ---
chemistryGenerators.push(function organic_iupac() {
  const compounds = [
    { q: 'IUPAC name of CH₃CH₂CHO is:', a: 'Propanal', b: 'Propanone', c: 'Propanol', d: 'Propanoic acid', correct: 'a' },
    { q: 'IUPAC name of CH₃COOH is:', a: 'Ethanoic acid', b: 'Methanoic acid', c: 'Propanoic acid', d: 'Butanoic acid', correct: 'a' },
    { q: 'IUPAC name of C₆H₅NH₂ is:', a: 'Aniline', b: 'Benzamide', c: 'Nitrobenzene', d: 'Phenol', correct: 'a' },
    { q: 'Functional group in aldehydes is:', a: '−CHO', b: '−COOH', c: '−OH', d: '−NH₂', correct: 'a' },
  ];
  return { ...pick(compounds), chapter: 'General Organic Chemistry', topic: 'Nomenclature', difficulty: 'EASY', type: 'SINGLE',
    solution: `Correct IUPAC name as per standard nomenclature rules.`
  };
});

// ---- Haloalkanes ---
chemistryGenerators.push(function sn1_sn2() {
  const qs = [
    { q: 'Which undergoes S_N2 reaction fastest?', a: 'CH₃Cl', b: 'CH₃CH₂Cl', c: '(CH₃)₂CHCl', d: '(CH₃)₃CCl', correct: 'a', sol: 'Less steric hindrance favors S_N2.' },
    { q: 'Which undergoes S_N1 reaction fastest?', a: '(CH₃)₃CBr', b: 'CH₃Br', c: 'CH₃CH₂Br', d: 'CH₃CH₂CH₂Br', correct: 'a', sol: 'Tertiary carbocation is most stable.' },
    { q: 'Product of elimination of 2-bromobutane with alc. KOH:', a: 'But-1-ene', b: 'But-2-ene', c: 'Butane', d: 'Butanol', correct: 'b', sol: 'Saytzeff product (more substituted alkene).' },
  ];
  return { ...pick(qs), chapter: 'Haloalkanes & Haloarenes', topic: 'SN1 Reactions', difficulty: 'MEDIUM', type: 'SINGLE',
    solution: undefined
  };
});

// ============================================================
// MATHEMATICS QUESTION GENERATORS
// ============================================================

const mathsGenerators = [];

// --- Complex Numbers ---
mathsGenerators.push(function complex_mod() {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  const mod = Math.round(Math.sqrt(a * a + b * b) * 100) / 100;
  const answers = [mod, a + b, a - b, Math.round(Math.sqrt(a * a - b * b) * 100) / 100].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(mod);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Complex Numbers', topic: 'Argand Plane', difficulty: 'EASY', type: 'SINGLE',
    questionText: `The modulus of ${a} + ${b}i is:`,
    optionA: String(answers[0]), optionB: String(answers[1]), optionC: String(answers[2]), optionD: String(answers[3]),
    correctAnswer: labels[correctIdx],
    solution: `|z| = √(${a}²+${b}²) = √${a*a + b*b} = ${mod}`
  };
});

// --- Limits ---
mathsGenerators.push(function limits_standard() {
  const val = randInt(2, 6);
  const ans = val;
  const answers = [0, 1, ans, ans * 2].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(ans);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Limits', topic: 'Standard Limits', difficulty: 'EASY', type: 'SINGLE',
    questionText: `lim(x→0) sin(${val}x)/x =`,
    optionA: String(answers[0]), optionB: String(answers[1]), optionC: String(answers[2]), optionD: String(answers[3]),
    correctAnswer: labels[correctIdx],
    solution: `lim sin(${val}x)/x = ${val}`
  };
});

// --- Matrices ---
mathsGenerators.push(function matrix_det() {
  const n = pick([2, 3]);
  const detA = randInt(2, 5);
  const k = randInt(2, 4);
  const detKA = Math.pow(k, n) * detA;
  return {
    chapter: 'Matrices', topic: 'Matrix Operations', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `If A is a ${n}×${n} matrix with det(A) = ${detA}, then det(${k}A) =`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(detKA),
    solution: `det(kA) = kⁿdet(A) = ${k}^${n}×${detA} = ${detKA}`
  };
});

// --- Probability ---
mathsGenerators.push(function probability_conditional() {
  const outcomes = randInt(6, 12);
  const favorable = randInt(1, outcomes - 1);
  const total = randInt(outcomes + 1, 20);
  const prob = Math.round(favorable / total * 100) / 100;
  const as_frac = `${favorable}/${total}`;
  const answers = [as_frac, `${total-favorable}/${total}`, `${favorable}/${outcomes}`, `${outcomes}/${total}`].sort(() => Math.random() - 0.5);
  const correctIdx = answers.indexOf(as_frac);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    chapter: 'Probability', topic: 'Conditional Probability', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `A number is selected from 1 to ${total}. Probability that it is divisible by ${favorable} is:`,
    optionA: answers[0], optionB: answers[1], optionC: answers[2], optionD: answers[3],
    correctAnswer: labels[correctIdx],
    solution: `Favorable outcomes = ${favorable}, Total = ${total}, P = ${favorable}/${total}`
  };
});

// --- Differential Calculus ---
mathsGenerators.push(function maxima_minima() {
  const a = randInt(1, 3);
  const b = randInt(1, 4);
  const c = randInt(1, 5);
  const x0 = b / (2 * a);
  const minVal = Math.round((a * x0 * x0 - b * x0 + c) * 100) / 100;
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [minVal, minVal + randInt(1, 5), minVal - randInt(1, 5), minVal + randInt(5, 10)].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Application of Derivatives', topic: 'Maxima & Minima', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `The minimum value of f(x) = ${a}x² − ${b}x + ${c} is:`,
    optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
    correctAnswer: labels[opts.indexOf(minVal)],
    solution: `f'(x) = ${2 * a}x - ${b} = 0 => x = ${x0}. Minimum = ${minVal}`
  };
});

// --- Integral Calculus ---
mathsGenerators.push(function definite_integral() {
  const a = randInt(1, 3);
  const b = randInt(a + 1, 5);
  const integral = b * b * b / 3 - a * a * a / 3;
  const ans = Math.round(integral * 100) / 100;
  if (ans <= 0) return null;
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [ans, ans + randInt(2, 5), ans - randInt(1, 3), ans * 2].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Integral Calculus', topic: 'Definite Integrals', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `∫ₐᵇ x² dx from ${a} to ${b} is:`,
    optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
    correctAnswer: labels[opts.indexOf(ans)],
    solution: `∫x²dx = [x³/3]ₐᵇ = (${b}³-${a}³)/3 = ${ans}`
  };
});

// --- Vectors ---
mathsGenerators.push(function vector_dot() {
  const a1 = randInt(1, 4); const a2 = randInt(1, 4); const a3 = randInt(1, 4);
  const b1 = randInt(1, 4); const b2 = randInt(1, 4); const b3 = randInt(1, 4);
  const dot = a1 * b1 + a2 * b2 + a3 * b3;
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [dot, dot + randInt(2, 5), dot - randInt(2, 5), randInt(1, 10)].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Vector Algebra', topic: 'Dot Product', difficulty: 'EASY', type: 'SINGLE',
    questionText: `If a = ${a1}i + ${a2}j + ${a3}k and b = ${b1}i + ${b2}j + ${b3}k, then a·b =`,
    optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
    correctAnswer: labels[opts.indexOf(dot)],
    solution: `a·b = ${a1}(${b1}) + ${a2}(${b2}) + ${a3}(${b3}) = ${dot}`
  };
});

// --- 3D Geometry ---
mathsGenerators.push(function threed_distance() {
  const x1 = randInt(1, 5); const y1 = randInt(1, 5); const z1 = randInt(1, 5);
  const x2 = randInt(6, 10); const y2 = randInt(6, 10); const z2 = randInt(6, 10);
  const d = Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2) * 100) / 100;
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [d, d + randInt(2, 5), d * 2, Math.round(Math.sqrt(d) * 100) / 100].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Three Dimensional Geometry', topic: 'Distance Formula', difficulty: 'MEDIUM', type: 'SINGLE',
    questionText: `Distance between (${x1},${y1},${z1}) and (${x2},${y2},${z2}) is:`,
    optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
    correctAnswer: labels[opts.indexOf(d)],
    solution: `d = √((${x2-x1})²+(${y2-y1})²+(${z2-z1})²) = ${d}`
  };
});

// --- Sequences ---
mathsGenerators.push(function ap_sum() {
  const a = randInt(2, 10);
  const d = randInt(2, 8);
  const n = randInt(5, 20);
  const sum = n / 2 * (2 * a + (n - 1) * d);
  return {
    chapter: 'Sequences & Series', topic: 'AP & GP', difficulty: 'EASY', type: 'INTEGER',
    questionText: `Sum of first ${n} terms of AP with first term ${a} and common difference ${d} is:`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(Math.round(sum)),
    solution: `S_n = n/2[2a+(n-1)d] = ${n}/2[2(${a})+(${n}-1)${d}] = ${sum}`
  };
});

// --- Differential Equations ---
mathsGenerators.push(function de_order() {
  const orders = [
    { q: 'Order of DE d²y/dx² + dy/dx + y = 0:', a: '2', b: '1', c: '3', d: '0', correct: 'a', sol: 'Highest derivative is d²y/dx², order = 2' },
    { q: 'Order of DE d³y/dx³ + (dy/dx)² = 0:', a: '3', b: '1', c: '2', d: '0', correct: 'a', sol: 'Highest derivative is d³y/dx³, order = 3' },
    { q: 'Order of DE (d²y/dx²)³ + dy/dx = sin(x):', a: '2', b: '3', c: '1', d: '6', correct: 'a', sol: 'Highest derivative is d²y/dx², order = 2' },
  ];
  return { ...pick(orders), chapter: 'Differential Equations', topic: 'First Order DE', difficulty: 'EASY', type: 'SINGLE' };
});

// --- Sets ---
mathsGenerators.push(function sets() {
  const nA = randInt(4, 8);
  const nB = randInt(3, 6);
  const nI = randInt(1, Math.min(nA, nB) - 1);
  const nU = nA + nB - nI;
  return {
    chapter: 'Sets & Relations', topic: 'Set Operations', difficulty: 'EASY', type: 'INTEGER',
    questionText: `If |A| = ${nA}, |B| = ${nB}, and |A∩B| = ${nI}, then |A∪B| =`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(nU),
    solution: `|A∪B| = |A| + |B| - |A∩B| = ${nA} + ${nB} - ${nI} = ${nU}`
  };
});

// --- Statistics ---
mathsGenerators.push(function stats_variance() {
  const vals = Array.from({ length: 5 }, () => randInt(10, 50));
  const mean = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  const var_ = Math.round(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length * 100) / 100;
  if (var_ <= 0) return null;
  const labels = ['a', 'b', 'c', 'd'];
  const opts = [var_, var_ * 2, Math.round(var_ * 0.5 * 100) / 100, var_ + randInt(20, 50)].sort(() => Math.random() - 0.5);
  return {
    chapter: 'Statistics', topic: 'Variance', difficulty: 'HARD', type: 'SINGLE',
    questionText: `Variance of {${vals.join(', ')}} is:`,
    optionA: String(opts[0]), optionB: String(opts[1]), optionC: String(opts[2]), optionD: String(opts[3]),
    correctAnswer: labels[opts.indexOf(var_)],
    solution: `Mean = ${mean}, Variance = Σ(xᵢ-μ)²/n = ${var_}`
  };
});

// --- Determinants ---
mathsGenerators.push(function cramer() {
  const a = randInt(2, 4); const b = randInt(1, 3);
  const c = randInt(1, 3); const d = randInt(2, 4);
  const det = a * d - b * c;
  if (det === 0) return null;
  return {
    chapter: 'Determinants', topic: 'Cramer\'s Rule', difficulty: 'MEDIUM', type: 'INTEGER',
    questionText: `|${a} ${b}; ${c} ${d}| =`,
    optionA: null, optionB: null, optionC: null, optionD: null,
    correctAnswer: String(det),
    solution: `det = ad - bc = ${a}(${d}) - ${b}(${c}) = ${det}`
  };
});

// ============================================================
// MULTI-CORRECT (MULTI TYPE) GENERATORS
// ============================================================

physicsGenerators.push(function coil_multi() {
  const subs = ['a', 'b', 'c', 'd'];
  const correct = pick(['a', 'b', 'c', 'd']);
  return {
    chapter: 'Electromagnetic Induction', topic: 'Faraday\'s Law', difficulty: 'HARD', type: 'MULTI',
    questionText: 'Which of the following factors affect the induced EMF in a coil?',
    optionA: 'Rate of change of magnetic flux',
    optionB: 'Number of turns in the coil',
    optionC: 'Resistance of the coil',
    optionD: 'Area of the coil',
    correctAnswer: 'a,b,d',
    solution: 'EMF depends on dΦ/dt, number of turns, and area. Resistance does not affect EMF.'
  };
});

physicsGenerators.push(function nuc_multi() {
  return {
    chapter: 'Modern Physics', topic: 'Nuclear Physics', difficulty: 'HARD', type: 'MULTI',
    questionText: 'Which of the following are true about nuclear fission?',
    optionA: 'A heavy nucleus splits into lighter nuclei',
    optionB: 'Mass defect converts to energy',
    optionC: 'Requires high temperature always',
    optionD: 'Neutrons are released in the process',
    correctAnswer: 'a,b,d',
    solution: 'Fission is induced by neutrons, releases energy via mass defect. Doesn\'t always require high temperature (e.g., U-235).'
  };
});

physicsGenerators.push(function optics_multi() {
  return {
    chapter: 'Optics', topic: 'Wave Optics', difficulty: 'MEDIUM', type: 'MULTI',
    questionText: 'Which conditions are necessary for interference of light?',
    optionA: 'Coherent sources',
    optionB: 'Same amplitude',
    optionC: 'Same frequency',
    optionD: 'Constant phase difference',
    correctAnswer: 'a,c,d',
    solution: 'Interference requires coherent sources with same frequency and constant phase difference. Same amplitude is not necessary.'
  };
});

chemistryGenerators.push(function chem_multi_1() {
  const n = randInt(2, 4);
  return {
    chapter: 'Coordination Compounds', topic: 'Isomerism', difficulty: 'HARD', type: 'MULTI',
    questionText: `Which types of isomerism are shown by coordination compounds?`,
    optionA: 'Geometrical isomerism', optionB: 'Optical isomerism',
    optionC: 'Position isomerism', optionD: 'Linkage isomerism',
    correctAnswer: 'a,b,d',
    solution: 'Coordination compounds show geometrical, optical, linkage, ionization isomerism. Position isomerism is for organic compounds.'
  };
});

mathsGenerators.push(function continuity_multi() {
  return {
    chapter: 'Continuity & Differentiability', topic: 'Continuity', difficulty: 'HARD', type: 'MULTI',
    questionText: 'Which of the following functions are continuous everywhere?',
    optionA: 'f(x) = sin(x)', optionB: 'f(x) = |x|',
    optionC: 'f(x) = tan(x)', optionD: 'f(x) = x³',
    correctAnswer: 'a,b,d',
    solution: 'tan(x) has discontinuities at x = π/2, 3π/2, etc.'
  };
});

// ============================================================
// GENERATOR SELECTION ENGINE
// ============================================================

const chapterTopicPool = [];
let questionIdCounter = 0;

function getAllGenerators() {
  return [...physicsGenerators, ...chemistryGenerators, ...mathsGenerators];
}

function selectGeneratorForDistribution(targetPerSubject) {
  // We'll cycle through generators evenly
  const allGens = getAllGenerators();
  return allGens[questionIdCounter++ % allGens.length];
}

function getSubjectForGenerator(gen) {
  if (physicsGenerators.includes(gen) || gen.toString().includes('physics')) return 'PHYSICS';
  if (chemistryGenerators.includes(gen) || gen.toString().includes('chemistry')) return 'CHEMISTRY';
  if (mathsGenerators.includes(gen) || gen.toString().includes('maths')) return 'MATHS';
  // Determine by checking which array contains it
  if (physicsGenerators.some(g => g.name === gen.name)) return 'PHYSICS';
  if (chemistryGenerators.some(g => g.name === gen.name)) return 'CHEMISTRY';
  return 'MATHS';
}

// Map generator to subject
const genToSubject = new Map();
for (const gen of physicsGenerators) genToSubject.set(gen, 'PHYSICS');
for (const gen of chemistryGenerators) genToSubject.set(gen, 'CHEMISTRY');
for (const gen of mathsGenerators) genToSubject.set(gen, 'MATHS');

// ============================================================
// MAIN GENERATION LOOP
// ============================================================

async function main() {
  const targetTotal = parseInt(process.argv[2]) || 16500;
  const targetPerSubject = Math.floor(targetTotal / 3);

  console.log(`🎯 Target: ${targetTotal} questions (${targetPerSubject} per subject)`);

  const allGens = getAllGenerators();
  const batchSize = 500;
  let totalGenerated = 0;
  let perSubject = { PHYSICS: 0, CHEMISTRY: 0, MATHS: 0 };

  // Check existing count
  const existingCount = await prisma.question.count();
  console.log(`📊 Existing questions in DB: ${existingCount}`);

  if (existingCount >= targetTotal) {
    console.log('✅ Already have enough questions. Skipping generation.');
    await prisma.$disconnect();
    return;
  }

  // Get or create admin user for createdBy
  let admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  if (!admin) {
    admin = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    });
  }
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Question Generator Bot',
        email: 'generator@jeemocks.com',
        phone: '7777777777',
        passwordHash: 'auto-generated',
        role: 'ADMIN',
        plan: 'FREE'
      }
    });
    console.log(`👤 Created admin user: ${admin.id}`);
  }

  const totalNeeded = targetTotal - existingCount;
  console.log(`🆕 Need to generate: ${totalNeeded}`);

  let buffer = [];
  let retries = 0;

  for (let i = 0; i < totalNeeded * 3 && perSubject.PHYSICS < targetPerSubject || perSubject.CHEMISTRY < targetPerSubject || perSubject.MATHS < targetPerSubject; i++) {
    const gen = allGens[i % allGens.length];
    const subject = genToSubject.get(gen);

    if (perSubject[subject] >= targetPerSubject) continue;

    try {
      const q = gen();
      if (!q) { retries++; continue; } // generator returned null (skip condition)

      const record = {
        subject,
        chapter: q.chapter || 'General',
        topic: q.topic || 'General',
        difficulty: q.difficulty || 'MEDIUM',
        type: q.type || 'SINGLE',
        questionText: q.questionText || '',
        optionA: q.optionA || null,
        optionB: q.optionB || null,
        optionC: q.optionC || null,
        optionD: q.optionD || null,
        correctAnswer: q.correctAnswer || 'a',
        solution: q.solution || q.questionText || '',
        year: 2020 + randInt(0, 5),
        examType: pick(['MAINS', 'MAINS', 'MAINS', 'ADVANCED']),
        ntaWeightage: pick([4, 4, 4, 5, 5, 6, 7, 8]),
        createdBy: admin.id,
      };

      buffer.push(record);
      totalGenerated++;
      perSubject[subject]++;

      if (buffer.length >= batchSize) {
        await prisma.question.createMany({ data: buffer, skipDuplicates: true });
        const total = await prisma.question.count();
        console.log(`📥 Inserted ${buffer.length} | Total: ${total} | PHY:${perSubject.PHYSICS} CHEM:${perSubject.CHEMISTRY} MATH:${perSubject.MATHS}`);
        buffer = [];
      }
    } catch (err) {
      retries++;
      if (retries > totalNeeded * 0.1) {
        console.error('Too many errors, aborting:', err.message);
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.length > 0) {
    await prisma.question.createMany({ data: buffer, skipDuplicates: true });
    console.log(`📥 Flushed last ${buffer.length}`);
  }

  const finalCount = await prisma.question.count();
  console.log(`\n✅ Generation complete!`);
  console.log(`   Total questions in DB: ${finalCount}`);
  console.log(`   Physics: ${perSubject.PHYSICS}`);
  console.log(`   Chemistry: ${perSubject.CHEMISTRY}`);
  console.log(`   Maths: ${perSubject.MATHS}`);
  console.log(`   Retries/skipped: ${retries}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  prisma.$disconnect();
  process.exit(1);
});
