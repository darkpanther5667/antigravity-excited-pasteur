const STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1zdHVkZW50LWlkIiwicm9sZSI6IlNUVURFTlQiLCJuYW1lIjoiRGV2IFN0dWRlbnQiLCJpYXQiOjE3ODA2Mzk0MjIsImV4cCI6MTc4MDcyNTgyMn0.dummysecret"; // We'll generate dynamic tokens using dev-token endpoint first!
async function run() {
  console.log("--- START TEST ENGINE VERIFICATION ---");

  // A. Generate dev tokens dynamically
  const adminToken = await getDevToken("ADMIN");
  const teacherToken = await getDevToken("TEACHER");
  const studentToken = await getDevToken("STUDENT");

  console.log("Dev tokens generated successfully");

  // B. Fetch first three active questions from database for Physics, Chemistry, Maths
  const qListRes = await fetch("http://localhost:3001/api/v1/questions");
  const qList = await qListRes.json();
  const activeQuestions = qList.data.questions;
  const physicsQ = activeQuestions.find(q => q.subject === 'PHYSICS');
  const chemistryQ = activeQuestions.find(q => q.subject === 'CHEMISTRY');
  const mathsQ = activeQuestions.find(q => q.subject === 'MATHS');

  if (!physicsQ || !chemistryQ || !mathsQ) {
    throw new Error("Missing seeded questions for subject categorization tests");
  }

  // Step 2: POST /api/v1/tests (ADMIN)
  const testPayload = {
    title: "JEE Mains Unit Test 1",
    type: "CHAPTER",
    exam_type: "MAINS",
    duration_minutes: 180,
    total_marks: 300,
    instructions: "Answer all questions.",
    scheduled_at: "2026-06-10T10:00:00.000Z"
  };

  const testRes = await fetch("http://localhost:3001/api/v1/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ ...testPayload, is_published: true }) // Send true to verify it gets overridden to false
  });
  const testData = await testRes.json();
  console.log("Step 2 - Create Test status:", testRes.status);
  console.log("Step 2 - is_published expected false, got:", testData.data.isPublished);
  const testId = testData.data.id;

  // Step 3: POST /api/v1/tests/:id/questions (TEACHER)
  const questionsPayload = {
    questions: [
      { question_id: physicsQ.id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.00, question_order: 1 },
      { question_id: chemistryQ.id, section: "CHEMISTRY", marks_correct: 4, marks_incorrect: -1.00, question_order: 2 },
      { question_id: mathsQ.id, section: "MATHS", marks_correct: 4, marks_incorrect: 0.00, question_order: 3 }
    ]
  };

  const addQRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify(questionsPayload)
  });
  const addQData = await addQRes.json();
  console.log("Step 3 - Add Questions status:", addQRes.status);
  console.log("Step 3 - question_count expected 3, got:", addQData.data.question_count);

  // Step 4: Add duplicate question_id
  const dupQRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questions: [
        { question_id: physicsQ.id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.00, question_order: 4 }
      ]
    })
  });
  console.log("Step 4 - Duplicate question_id (expected 400): Status", dupQRes.status, "Body:", await dupQRes.text());

  // Step 5: Add duplicate question_order
  const dupOrderRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questions: [
        { question_id: activeQuestions[4].id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.00, question_order: 1 } // order 1 is already used
      ]
    })
  });
  console.log("Step 5 - Duplicate question_order (expected 400): Status", dupOrderRes.status, "Body:", await dupOrderRes.text());

  // Step 6: Start test (STUDENT) - test not published
  const startUnpubRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  console.log("Step 6 - Start unpublished test (expected 400): Status", startUnpubRes.status, "Body:", await startUnpubRes.text());

  // Step 7: PATCH /api/v1/tests/:id/publish
  const pubRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ is_published: true })
  });
  const pubData = await pubRes.json();
  console.log("Step 7 - Publish test status:", pubRes.status, "is_published expected true, got:", pubData.data.is_published);

  // Step 8: Start test (STUDENT) - published
  const startRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  const startData = await startRes.json();
  console.log("Step 8 - Start published test status:", startRes.status);
  const qObj = startData.data.questions[0];
  console.log("Step 8 - question correctAnswer present (expected undefined):", qObj.correctAnswer);
  console.log("Step 8 - question solution present (expected undefined):", qObj.solution);
  console.log("Step 8 - time_remaining_seconds expected 10800, got:", startData.data.time_remaining_seconds);
  const attemptId = startData.data.attempt_id;

  // Step 9: Start test again (same student, same test - resume)
  const startResumeRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken}` }
  });
  const startResumeData = await startResumeRes.json();
  console.log("Step 9 - Resume status:", startResumeRes.status);
  console.log("Step 9 - attempt_id expected match:", startResumeData.data.attempt_id === attemptId);

  // Step 10: save-response (upsert check)
  // Call once: set answer 'a'
  const save1 = await fetch(`http://localhost:3001/api/v1/tests/${testId}/save-response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: physicsQ.id,
      selected_answer: "a",
      status: "ANSWERED",
      time_spent_seconds: 45,
      time_remaining: 9900
    })
  });
  console.log("Step 10 - Save response 1 status:", save1.status);

  // Call again: set answer 'b'
  const save2 = await fetch(`http://localhost:3001/api/v1/tests/${testId}/save-response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: physicsQ.id,
      selected_answer: "b",
      status: "ANSWERED",
      time_spent_seconds: 55,
      time_remaining: 9800
    })
  });
  console.log("Step 10 - Save response 2 status:", save2.status);

  // Step 13: GET result before submit (fresh attempt)
  // Let's create a fresh student attempt for this check
  const studentToken2 = await getDevToken("STUDENT", "student2");
  const startFreshRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${studentToken2}` }
  });
  const startFreshData = await startFreshRes.json();
  const freshAttemptId = startFreshData.data.attempt_id;

  const resultUnsubRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/result/${freshAttemptId}`, {
    headers: { "Authorization": `Bearer ${studentToken2}` }
  });
  console.log("Step 13 - Result before submission (expected 400): Status", resultUnsubRes.status, "Body:", await resultUnsubRes.text());

  // Step 11: submit (first attempt)
  const submitRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ attempt_id: attemptId })
  });
  const submitData = await submitRes.json();
  console.log("Step 11 - Submit test status:", submitRes.status);
  const respQ = submitData.data.responses[0];
  console.log("Step 11 - response correct_answer present:", respQ.correct_answer !== undefined);
  console.log("Step 11 - response solution present:", respQ.solution !== undefined);

  // Step 12: submit again
  const submitAgainRes = await fetch(`http://localhost:3001/api/v1/tests/${testId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ attempt_id: attemptId })
  });
  console.log("Step 12 - Submit again (expected 400): Status", submitAgainRes.status, "Body:", await submitAgainRes.text());

  // Step 16: create-nta-mains (throw shortfall check)
  const mainsRes = await fetch("http://localhost:3001/api/v1/tests/create-nta-mains", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`
    },
    body: JSON.stringify({ title: "NTA Mains Mega Test" })
  });
  console.log("Step 16 - Create NTA Mains (expected shortfall 400): Status", mainsRes.status);
  const mainsData = await mainsRes.json();
  console.log("Step 16 - Shortfall Details:", JSON.stringify(mainsData.shortfall, null, 2));
}

async function getDevToken(role, sub = "") {
  const res = await fetch("http://localhost:3001/api/v1/auth/dev-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, sub }) // sub is optional to vary IDs
  });
  const body = await res.json();
  return body.data.token;
}

run().catch(console.error);
