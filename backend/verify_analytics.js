// Native fetch used

async function getDevToken(role, sub = "") {
  const res = await fetch("http://localhost:3001/api/v1/auth/dev-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, sub })
  });
  const body = await res.json();
  return body.data.token;
}

async function run() {
  console.log("=== STARTING MODULE 4 ANALYTICS VERIFICATION ===");
  
  // Create unique student ID for clean test
  const studentSub = "student-analytics-" + Date.now();
  const studentToken = await getDevToken("STUDENT", studentSub);
  const adminToken = await getDevToken("ADMIN");
  const teacherToken = await getDevToken("TEACHER");

  console.log("Tokens generated.");

  // 1. GET /api/v1/analytics/me/overview (no auth) -> 401
  const step1Res = await fetch("http://localhost:3001/api/v1/analytics/me/overview");
  console.log(`Step 1 (no auth): Status = ${step1Res.status} (Expected: 401)`);
  const step1Body = await step1Res.json();
  console.log(`Step 1 body:`, step1Body);

  // 2. GET /api/v1/analytics/me/overview (STUDENT token, no attempts) -> 404
  const step2Res = await fetch("http://localhost:3001/api/v1/analytics/me/overview", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 2 (auth but no attempts): Status = ${step2Res.status} (Expected: 404)`);
  const step2Body = await step2Res.json();
  console.log(`Step 2 error message: "${step2Body.error}" (Expected: 'No submitted attempts found for this user')`);

  // Fetch active questions from Question Bank
  const qListRes = await fetch("http://localhost:3001/api/v1/questions");
  const qList = await qListRes.json();
  const questions = qList.data.questions;
  
  const physicsQ = questions.filter(q => q.subject === 'PHYSICS');
  const chemistryQ = questions.filter(q => q.subject === 'CHEMISTRY');
  const mathsQ = questions.filter(q => q.subject === 'MATHS');

  if (physicsQ.length < 3 || chemistryQ.length < 3 || mathsQ.length < 3) {
    throw new Error(`Insufficient seeded questions. Found P:${physicsQ.length}, C:${chemistryQ.length}, M:${mathsQ.length}`);
  }

  // 3. Submit at least 2 tests using Module 3 endpoints
  // Let's create two tests and submit attempts on them.
  console.log("Creating Test 1...");
  const test1Res = await fetch("http://localhost:3001/api/v1/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: "Analytics Unit Test 1",
      type: "CHAPTER",
      exam_type: "MAINS",
      duration_minutes: 180,
      total_marks: 300,
      instructions: "Instructions",
      scheduled_at: null
    })
  });
  const test1 = (await test1Res.json()).data;
  
  // Add 3 questions to Test 1
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questions: [
        { question_id: physicsQ[0].id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.0, question_order: 1 },
        { question_id: chemistryQ[0].id, section: "CHEMISTRY", marks_correct: 4, marks_incorrect: -1.0, question_order: 2 },
        { question_id: mathsQ[0].id, section: "MATHS", marks_correct: 4, marks_incorrect: -1.0, question_order: 3 }
      ]
    })
  });

  // Publish Test 1
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ is_published: true })
  });

  console.log("Creating Test 2...");
  const test2Res = await fetch("http://localhost:3001/api/v1/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: "Analytics Unit Test 2",
      type: "CHAPTER",
      exam_type: "MAINS",
      duration_minutes: 180,
      total_marks: 300,
      instructions: "Instructions",
      scheduled_at: null
    })
  });
  const test2 = (await test2Res.json()).data;

  // Add 3 questions to Test 2
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questions: [
        { question_id: physicsQ[1].id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.0, question_order: 1 },
        { question_id: chemistryQ[1].id, section: "CHEMISTRY", marks_correct: 4, marks_incorrect: -1.0, question_order: 2 },
        { question_id: mathsQ[1].id, section: "MATHS", marks_correct: 4, marks_incorrect: -1.0, question_order: 3 }
      ]
    })
  });

  // Publish Test 2
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ is_published: true })
  });

  // Let's take and submit both tests for student
  // Test 1: physics correct, chemistry correct, maths wrong
  const start1 = await (await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken}` }
  })).json();
  const attempt1Id = start1.data.attempt_id;

  // Save response physics (correct)
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt1Id,
      question_id: physicsQ[0].id,
      selected_answer: physicsQ[0].correct_answer,
      status: "ANSWERED",
      time_spent_seconds: 40,
      time_remaining: 10000
    })
  });

  // Save response chemistry (correct)
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt1Id,
      question_id: chemistryQ[0].id,
      selected_answer: chemistryQ[0].correct_answer,
      status: "ANSWERED",
      time_spent_seconds: 50,
      time_remaining: 9900
    })
  });

  // Save response maths (incorrect)
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt1Id,
      question_id: mathsQ[0].id,
      selected_answer: "x", // wrong answer
      status: "ANSWERED",
      time_spent_seconds: 30, // Maths time < 35s to test time pressure pattern
      time_remaining: 9800
    })
  });

  // Submit Test 1
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({ attempt_id: attempt1Id })
  });

  // Test 2: physics correct, chemistry wrong, maths wrong
  const start2 = await (await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken}` }
  })).json();
  const attempt2Id = start2.data.attempt_id;

  // Save response physics (correct)
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt2Id,
      question_id: physicsQ[1].id,
      selected_answer: physicsQ[1].correct_answer,
      status: "ANSWERED",
      time_spent_seconds: 40,
      time_remaining: 10000
    })
  });

  // Save response chemistry (incorrect)
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt2Id,
      question_id: chemistryQ[1].id,
      selected_answer: "x", // wrong
      status: "ANSWERED",
      time_spent_seconds: 50,
      time_remaining: 9900
    })
  });

  // Save response maths (incorrect)
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/save-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({
      attempt_id: attempt2Id,
      question_id: mathsQ[1].id,
      selected_answer: "x", // wrong
      status: "ANSWERED",
      time_spent_seconds: 30, // Maths time < 35s
      time_remaining: 9800
    })
  });

  // Submit Test 2
  await fetch(`http://localhost:3001/api/v1/tests/${test2.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${studentToken}` },
    body: JSON.stringify({ attempt_id: attempt2Id })
  });

  console.log("Attempts submitted.");

  // Let's also create a second student attempt to test topper comparison
  const topperSub = "student-topper-" + Date.now();
  const topperToken = await getDevToken("STUDENT", topperSub);
  
  const startTopper = await (await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${topperToken}` }
  })).json();
  const attemptTopperId = startTopper.data.attempt_id;

  // Topper answers ALL correct on Test 1
  for (let i = 0; i < 3; i++) {
    const q = [physicsQ[0], chemistryQ[0], mathsQ[0]][i];
    await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/save-response`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${topperToken}` },
      body: JSON.stringify({
        attempt_id: attemptTopperId,
        question_id: q.id,
        selected_answer: q.correct_answer,
        status: "ANSWERED",
        time_spent_seconds: 30,
        time_remaining: 10000
      })
    });
  }

  // Submit Topper
  await fetch(`http://localhost:3001/api/v1/tests/${test1.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${topperToken}` },
    body: JSON.stringify({ attempt_id: attemptTopperId })
  });

  console.log("Topper attempt submitted.");

  // NOW RUN VERIFICATIONS

  // 3. GET /api/v1/analytics/me/overview
  const step3Res = await fetch("http://localhost:3001/api/v1/analytics/me/overview", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 3: Status = ${step3Res.status} (Expected: 200)`);
  const overview = (await step3Res.json()).data;
  console.log(`total_tests_taken = ${overview.total_tests_taken} (Expected: 2)`);
  console.log(`subject_averages keys:`, Object.keys(overview.subject_averages));
  console.log(`recent_trend = "${overview.recent_trend}" (Expected: stable/improving/declining)`);

  // 4. GET /api/v1/analytics/me/subject/PHYSICS
  const step4Res = await fetch("http://localhost:3001/api/v1/analytics/me/subject/PHYSICS", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 4: Status = ${step4Res.status} (Expected: 200)`);
  const physicsData = (await step4Res.json()).data;
  console.log(`chapter_breakdown array length = ${physicsData.chapter_breakdown.length} (Expected: > 0)`);
  console.log(`difficulty_breakdown key check for first chapter:`, Object.keys(physicsData.chapter_breakdown[0].difficulty_breakdown));
  console.log(`weak_chapters:`, physicsData.weak_chapters);
  console.log(`strong_chapters:`, physicsData.strong_chapters);

  // 5. GET /api/v1/analytics/me/subject/INVALID
  const step5Res = await fetch("http://localhost:3001/api/v1/analytics/me/subject/INVALID", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 5: Status = ${step5Res.status} (Expected: 400)`);
  const step5Body = await step5Res.json();
  console.log(`Step 5 error = "${step5Body.error}" (Expected: 'Invalid subject. Must be PHYSICS, CHEMISTRY or MATHS')`);

  // 6. GET /api/v1/analytics/me/chapter-heatmap
  const step6Res = await fetch("http://localhost:3001/api/v1/analytics/me/chapter-heatmap", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 6: Status = ${step6Res.status} (Expected: 200)`);
  const heatmapData = (await step6Res.json()).data;
  console.log(`First heatmap item:`, heatmapData.heatmap[0]);
  const invalidHeatLevel = heatmapData.heatmap.some(h => h.heat_level < 1 || h.heat_level > 5);
  console.log(`All heat levels between 1 and 5: ${!invalidHeatLevel}`);
  console.log(`Chapters with < 5 attempts flagged insufficient_data:`, heatmapData.heatmap.every(h => h.attempted < 5 ? h.insufficient_data === true : true));

  // 7. GET /api/v1/analytics/me/time-analysis
  const step7Res = await fetch("http://localhost:3001/api/v1/analytics/me/time-analysis", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 7: Status = ${step7Res.status} (Expected: 200)`);
  const timeData = (await step7Res.json()).data;
  console.log(`time_distribution buckets:`, timeData.time_distribution);
  const hasNegativeBucket = timeData.time_distribution.some(b => b.count < 0);
  console.log(`No negative counts: ${!hasNegativeBucket}`);
  console.log(`slow_chapters count = ${timeData.slow_chapters.length} (Expected: <= 5)`);

  // 8. GET /api/v1/analytics/me/progress
  const step8Res = await fetch("http://localhost:3001/api/v1/analytics/me/progress", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 8: Status = ${step8Res.status} (Expected: 200)`);
  const progressData = (await step8Res.json()).data;
  console.log(`tests count = ${progressData.tests.length}`);
  console.log(`score_trend count = ${progressData.score_trend.length}`);
  console.log(`percentile_trend count = ${progressData.percentile_trend.length}`);

  // 9. GET /api/v1/analytics/test/:testId/compare/:attemptId
  const step9Res = await fetch(`http://localhost:3001/api/v1/analytics/test/${test1.id}/compare/${attempt1Id}`, {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 9: Status = ${step9Res.status} (Expected: 200)`);
  const compareData = (await step9Res.json()).data;
  console.log(`Topper name/userId present? name: ${compareData.topper.name}, userId: ${compareData.topper.userId} (Expected: undefined, undefined)`);
  console.log(`gap_analysis score_gap = ${compareData.gap_analysis.score_gap}`);
  console.log(`weak_vs_topper:`, compareData.gap_analysis.weak_vs_topper);

  // 10. GET /api/v1/analytics/me/swot
  const step10Res = await fetch("http://localhost:3001/api/v1/analytics/me/swot", {
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log(`Step 10: Status = ${step10Res.status} (Expected: 200)`);
  const swotData = (await step10Res.json()).data;
  console.log(`SWOT keys:`, Object.keys(swotData));
  console.log(`priority_action: "${swotData.priority_action}"`);

  // 11. Accuracy manual check:
  // Test 1: Physics correct (1/1 attempted, 100%), Chemistry correct (1/1 attempted, 100%), Maths wrong (1/1 attempted, 0%)
  // Test 2: Physics correct (100%), Chemistry wrong (0%), Maths wrong (0%)
  // Student overall Physics accuracy = 2/2 = 100%
  // Student overall Chemistry accuracy = 1/2 = 50%
  // Student overall Maths accuracy = 0/2 = 0%
  console.log(`Step 11 (Accuracy manual check):`);
  console.log(`Physics Accuracy expected 100%, got: ${overview.subject_averages.physics.avg_accuracy}%`);
  console.log(`Chemistry Accuracy expected 50%, got: ${overview.subject_averages.chemistry.avg_accuracy}%`);
  console.log(`Maths Accuracy expected 0%, got: ${overview.subject_averages.maths.avg_accuracy}%`);

  // 12. Heat level boundary check
  // Physics accuracy is 100%, should be heat_level 5
  // Chemistry accuracy is 50%, should be heat_level 3
  // Maths accuracy is 0%, should be heat_level 1
  console.log(`Step 12 (Heat level boundary check):`);
  heatmapData.heatmap.forEach(h => {
    console.log(`Subject: ${h.subject}, Chapter: ${h.chapter}, Accuracy: ${h.accuracy}%, Heat Level: ${h.heat_level}`);
  });

  // 13. SWOT priority action check
  // Weakest chapter with highest NTA weightage should be mentioned in priority_action.
  // Both Maths chapters are at 0% accuracy, Chemistry is at 50%.
  // Let's verify priority_action format.
  console.log(`Step 13 (Priority Action details):`);
  console.log(`Priority action = "${swotData.priority_action}"`);

  console.log("=== VERIFICATION FINISHED ===");
}

run().catch(console.error);
