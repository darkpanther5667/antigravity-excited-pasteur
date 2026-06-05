import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check if questions already exist
  const count = await prisma.question.count();
  if (count > 0) {
    console.log('DB already seeded, skipping');
    return;
  }

  // Ensure default teacher user exists for FK relation
  const defaultUser = await prisma.user.upsert({
    where: { email: 'teacher@test.com' },
    update: {},
    create: {
      id: 'dev-teacher-id',
      name: 'Default Teacher',
      email: 'teacher@test.com',
      phone: '9999999999',
      passwordHash: 'seededpasswordhash',
      role: 'TEACHER',
      plan: 'FREE'
    }
  });

  const questionsData = [
    // --- PHYSICS (3 questions) ---
    {
      subject: 'PHYSICS',
      chapter: 'Kinematics',
      topic: 'Projectile Motion',
      difficulty: 'EASY',
      type: 'SINGLE',
      questionText: 'A particle is projected with a velocity $u$ at an angle $\\theta$ to the horizontal. The range of the projectile is given by:',
      optionA: '$\\frac{u^2 \\sin 2\\theta}{g}$',
      optionB: '$\\frac{u^2 \\cos 2\\theta}{g}$',
      optionC: '$\\frac{2u \\sin \\theta}{g}$',
      optionD: '$\\frac{u^2 \\sin^2 \\theta}{2g}$',
      correctAnswer: 'a',
      solution: 'The range of a projectile is given by $R = \\frac{u^2 \\sin 2\\theta}{g}$. Therefore, option (a) is correct.',
      year: 2021,
      examType: 'MAINS',
      ntaWeightage: 8,
      createdBy: defaultUser.id
    },
    {
      subject: 'PHYSICS',
      chapter: 'Laws of Motion',
      topic: 'Friction',
      difficulty: 'MEDIUM',
      type: 'SINGLE',
      questionText: 'A block of mass $m = 2\\text{ kg}$ is kept on a rough horizontal surface with coefficient of friction $\\mu = 0.5$. A horizontal force of $5\\text{ N}$ is applied. What is the frictional force?',
      optionA: '10 N',
      optionB: '5 N',
      optionC: '2 N',
      optionD: '0 N',
      correctAnswer: 'b',
      solution: 'The maximum static friction is $f_{max} = \\mu mg = 0.5 \\times 2 \\times 10 = 10\\text{ N}$. Since the applied force is $5\\text{ N} < 10\\text{ N}$, the friction force matches the applied force, which is $5\\text{ N}$.',
      year: 2022,
      examType: 'MAINS',
      ntaWeightage: 7,
      createdBy: defaultUser.id
    },
    {
      subject: 'PHYSICS',
      chapter: 'Electrostatics',
      topic: 'Electric Field',
      difficulty: 'HARD',
      type: 'MULTI',
      questionText: 'For a uniform spherical charge distribution of radius $R$ and total charge $Q$, which of the following statements are correct? (Let $r$ be distance from center)',
      optionA: 'Electric field inside ($r < R$) is directly proportional to $r$',
      optionB: 'Electric field outside ($r > R$) is proportional to $r^{-2}$',
      optionC: 'Potential inside ($r < R$) is constant',
      optionD: 'Potential outside ($r > R$) is proportional to $r^{-1}$',
      correctAnswer: 'a,b,d',
      solution: 'The electric field inside is $E_{in} = \\frac{Qr}{4\\pi\\varepsilon_0 R^3} \\propto r$ and outside is $E_{out} = \\frac{Q}{4\\pi\\varepsilon_0 r^2} \\propto \\frac{1}{r^2}$. The potential outside is $V_{out} \\propto r^{-1}$. Thus, statements a, b, and d are correct.',
      year: 2023,
      examType: 'ADVANCED',
      ntaWeightage: 9,
      createdBy: defaultUser.id
    },
    // --- CHEMISTRY (3 questions) ---
    {
      subject: 'CHEMISTRY',
      chapter: 'Mole Concept',
      topic: 'Stoichiometry',
      difficulty: 'EASY',
      type: 'SINGLE',
      questionText: 'What is the mass of $3.011 \\times 10^{23}$ atoms of Carbon-12?',
      optionA: '12 g',
      optionB: '6 g',
      optionC: '3 g',
      optionD: '24 g',
      correctAnswer: 'b',
      solution: 'Mass of Carbon atoms = $\\frac{3.011 \\times 10^{23}}{6.022 \\times 10^{23}} \\times 12\\text{ g} = 6\\text{ g}$.',
      year: 2020,
      examType: 'MAINS',
      ntaWeightage: 5,
      createdBy: defaultUser.id
    },
    {
      subject: 'CHEMISTRY',
      chapter: 'Chemical Bonding',
      topic: 'VSEPR Theory',
      difficulty: 'MEDIUM',
      type: 'MULTI',
      questionText: 'Which of the following molecules have a planar geometry according to VSEPR theory?',
      optionA: '$BF_3$',
      optionB: '$NH_3$',
      optionC: '$H_2O$',
      optionD: '$XeF_4$',
      correctAnswer: 'a,d',
      solution: '$BF_3$ has Trigonal Planar ($sp^2$) geometry and $XeF_4$ has Square Planar ($sp^3d^2$) geometry. Therefore, options a and d represent planar structures.',
      year: 2022,
      examType: 'ADVANCED',
      ntaWeightage: 8,
      createdBy: defaultUser.id
    },
    {
      subject: 'CHEMISTRY',
      chapter: 'Electrochemistry',
      topic: 'Nernst Equation',
      difficulty: 'HARD',
      type: 'INTEGER',
      questionText: 'At $298\\text{ K}$, the cell potential for a concentration cell with ratio of ion concentrations $\\frac{[M^{2+}]_{RHS}}{[M^{2+}]_{LHS}} = 100$ is given by $V \\times 10^{-2}\\text{ V}$. Find the integer value of $V$. (Take $\\frac{2.303 RT}{F} = 0.059\\text{ V}$)',
      optionA: null,
      optionB: null,
      optionC: null,
      optionD: null,
      correctAnswer: '6',
      solution: 'Using the Nernst Equation: $E_{cell} = -\\frac{0.059}{2} \\log(100) = -0.059\\text{ V}$. Magnitude is $5.9 \\times 10^{-2}\\text{ V}$, which rounds to the integer value of $6$.',
      year: 2023,
      examType: 'ADVANCED',
      ntaWeightage: 9,
      createdBy: defaultUser.id
    },
    // --- MATHS (4 questions) ---
    {
      subject: 'MATHS',
      chapter: 'Limits',
      topic: 'Standard Limits',
      difficulty: 'EASY',
      type: 'SINGLE',
      questionText: 'Evaluate the limit $\\lim_{x \\to 0} \\frac{1 - \\cos x}{x^2}$:',
      optionA: '0',
      optionB: '1',
      optionC: '1/2',
      optionD: '2',
      correctAnswer: 'c',
      solution: 'We know $\\lim_{x \\to 0} \\frac{1 - \\cos x}{x^2} = \\lim_{x \\to 0} \\frac{2 \\sin^2(x/2)}{4(x/2)^2} = \\frac{1}{2}$. Hence, option (c) is correct.',
      year: 2020,
      examType: 'MAINS',
      ntaWeightage: 6,
      createdBy: defaultUser.id
    },
    {
      subject: 'MATHS',
      chapter: 'Matrices',
      topic: 'Determinants',
      difficulty: 'MEDIUM',
      type: 'INTEGER',
      questionText: 'If $A$ is a $3 \\times 3$ matrix such that $|A| = 4$, then find the value of $|2A|$.',
      optionA: null,
      optionB: null,
      optionC: null,
      optionD: null,
      correctAnswer: '32',
      solution: 'For a matrix of order $n \\times n$, we have $|kA| = k^n |A|$. Here, $n=3$, so $|2A| = 2^3 |A| = 8 \\times 4 = 32$.',
      year: 2021,
      examType: 'MAINS',
      ntaWeightage: 7,
      createdBy: defaultUser.id
    },
    {
      subject: 'MATHS',
      chapter: 'Probability',
      topic: 'Bayes Theorem',
      difficulty: 'HARD',
      type: 'SINGLE',
      questionText: 'A pack of cards has one missing card. Two cards drawn are both clubs. The probability that the missing card is a club is:',
      optionA: '11/50',
      optionB: '13/50',
      optionC: '1/4',
      optionD: '39/50',
      correctAnswer: 'a',
      solution: 'Using Bayes Theorem, let $E_1$ be event that the missing card is a club. $P(E_1) = 1/4$. Remaining cards are 51. $P(A|E_1) = \\frac{12 \\times 11}{51 \\times 50}$. Calculations yield $\\frac{11}{50}$.',
      year: 2022,
      examType: 'ADVANCED',
      ntaWeightage: 9,
      createdBy: defaultUser.id
    },
    {
      subject: 'MATHS',
      chapter: 'Limits',
      topic: 'LHopitals Rule',
      difficulty: 'HARD',
      type: 'SINGLE',
      questionText: 'Find the value of $\\lim_{x \\to 0} \\frac{e^{x^2} - \\cos x}{x^2}$:',
      optionA: '1',
      optionB: '3/2',
      optionC: '2',
      optionD: '1/2',
      correctAnswer: 'b',
      solution: "Using L'Hopital's Rule or expansions: $e^{x^2} \\\\approx 1 + x^2$, \\\\cos x \\\\approx 1 - x^2/2$. Limit evaluates to \\\\lim_{x \\\\to 0} \\\\frac{(1+x^2) - (1-x^2/2)}{x^2} = \\\\frac{3}{2}$.",
      year: 2024,
      examType: 'ADVANCED',
      ntaWeightage: 9,
      createdBy: defaultUser.id
    }
  ];

  await prisma.question.createMany({
    data: questionsData
  });

  console.log(`Seeded ${questionsData.length} questions successfully`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
