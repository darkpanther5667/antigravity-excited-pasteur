import db from './src/models/db.js';
import { sanitizeForAttempt, sanitizeForResult } from './src/utils/sanitizeQuestion.js';

const STUDENT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRldi1zdHVkZW50LWlkIiwicm9sZSI6IlNUVURFTlQiLCJuYW1lIjoiRGV2IFN0dWRlbnQiLCJpYXQiOjE3ODA2Mzk0MjIsImV4cCI6MTc4MDcyNTgyMn0.dummysecret";

async function run() {
  console.log("--- START SCORING & SANITIZATION ACCURACY TESTS ---");

  const adminToken = await getDevToken("ADMIN");
  const studentToken = await getDevToken("STUDENT");

  // Fetch target questions
  const questions = await db.question.findMany({ where: { deletedAt: null } });
  
  // Q1: SINGLE, correct: 'a'
  const qSingleA = questions.find(q => q.type === 'SINGLE' && q.correctAnswer === 'a');
  // Q2: SINGLE, correct: 'b'
  const qSingleB = questions.find(q => q.type === 'SINGLE' && q.correctAnswer === 'b');
  // Q3: INTEGER, correct: '6'
  const qInteger6 = questions.find(q => q.type === 'INTEGER' && q.correctAnswer === '6');
  // Q4: MULTI, correct: 'a,d'
  const qMultiAD = questions.find(q => q.type === 'MULTI' && q.correctAnswer === 'a,d');

  if (!qSingleA || !qSingleB || !qInteger6 || !qMultiAD) {
    console.error("Missing seeded questions for scoring accuracy checks!");
    return;
  }

  // ==========================================
  // TEST case 14: SINGLE + INTEGER scoring (Expected: 7)
  // ==========================================
  const test1 = await createTestRecord(adminToken, "Scoring Check 1");
  await attachQuestions(adminToken, test1.id, [
    { question_id: qSingleA.id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.00, question_order: 1 },
    { question_id: qSingleB.id, section: "PHYSICS", marks_correct: 4, marks_incorrect: -1.00, question_order: 2 },
    { question_id: qInteger6.id, section: "CHEMISTRY", marks_correct: 4, marks_incorrect: 0.00, question_order: 3 }
  ]);
  await publishTest(adminToken, test1.id);

  const att1 = await startTest(studentToken, test1.id);
  
  // Save responses: Q1 -> 'a' (correct), Q2 -> 'c' (wrong), Q3 -> '6' (correct)
  await saveResponse(studentToken, test1.id, att1.attempt_id, qSingleA.id, "a", "ANSWERED");
  await saveResponse(studentToken, test1.id, att1.attempt_id, qSingleB.id, "c", "ANSWERED");
  await saveResponse(studentToken, test1.id, att1.attempt_id, qInteger6.id, "6", "ANSWERED");

  const submit1 = await submitTest(studentToken, test1.id, att1.attempt_id);
  console.log("Step 14 - SINGLE + INTEGER Score expected 7, got:", submit1.scores.total);

  // ==========================================
  // TEST case 15: MULTI scoring checks
  // ==========================================
  
  // Case 15.1: MULTI exact match (expected +4)
  const score1 = await runMultiTest(adminToken, studentToken, qMultiAD.id, "a,d");
  console.log("Step 15.1 - MULTI exact match ('a,d') expected 4, got:", score1);

  // Case 15.2: MULTI partial match (expected +1)
  const score2 = await runMultiTest(adminToken, studentToken, qMultiAD.id, "a");
  console.log("Step 15.2 - MULTI partial match ('a') expected 1, got:", score2);

  // Case 15.3: MULTI wrong choice included (expected -2)
  const score3 = await runMultiTest(adminToken, studentToken, qMultiAD.id, "a,b");
  console.log("Step 15.3 - MULTI wrong choice ('a,b') expected -2, got:", score3);

  // Case 15.4: MULTI unanswered (expected 0)
  const score4 = await runMultiTest(adminToken, studentToken, qMultiAD.id, null);
  console.log("Step 15.4 - MULTI unanswered expected 0, got:", score4);

  // ==========================================
  // TEST case 17: sanitizeForAttempt check
  // ==========================================
  const sampleQ = questions[0];
  const sanitizedAtt = sanitizeForAttempt(sampleQ);
  console.log("Step 17 - sanitizeForAttempt has correctAnswer (expected false):", "correctAnswer" in sanitizedAtt || "correct_answer" in sanitizedAtt);
  console.log("Step 17 - sanitizeForAttempt has solution (expected false):", "solution" in sanitizedAtt);

  const sanitizedRes = sanitizeForResult(sampleQ);
  console.log("Step 17 - sanitizeForResult has correctAnswer (expected true):", "correctAnswer" in sanitizedRes);
  console.log("Step 17 - sanitizeForResult has solution (expected true):", "solution" in sanitizedRes);
}

// Helpers
async function getDevToken(role) {
  const res = await fetch("http://localhost:3001/api/v1/auth/dev-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role })
  });
  const body = await res.json();
  return body.data.token;
}

async function createTestRecord(token, title) {
  const res = await fetch("http://localhost:3001/api/v1/tests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title,
      type: "CHAPTER",
      exam_type: "MAINS",
      duration_minutes: 60,
      total_marks: 100
    })
  });
  const body = await res.json();
  return body.data;
}

async function attachQuestions(token, testId, questions) {
  await fetch(`http://localhost:3001/api/v1/tests/${testId}/questions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ questions })
  });
}

async function publishTest(token, testId) {
  await fetch(`http://localhost:3001/api/v1/tests/${testId}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ is_published: true })
  });
}

async function startTest(token, testId) {
  const res = await fetch(`http://localhost:3001/api/v1/tests/${testId}/start`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` }
  });
  const body = await res.json();
  return body.data;
}

async function saveResponse(token, testId, attemptId, questionId, selectedAnswer, status) {
  await fetch(`http://localhost:3001/api/v1/tests/${testId}/save-response`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      status,
      time_spent_seconds: 10,
      time_remaining: 3500
    })
  });
}

async function submitTest(token, testId, attemptId) {
  const res = await fetch(`http://localhost:3001/api/v1/tests/${testId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ attempt_id: attemptId })
  });
  const body = await res.json();
  return body.data;
}

async function runMultiTest(adminToken, studentToken, questionId, answer) {
  // Create a clean test with 1 MULTI question
  const t = await createTestRecord(adminToken, "Multi Scoring Test");
  await attachQuestions(adminToken, t.id, [
    { question_id: questionId, section: "CHEMISTRY", marks_correct: 4, marks_incorrect: -2.00, question_order: 1 }
  ]);
  await publishTest(adminToken, t.id);

  const att = await startTest(studentToken, t.id);
  if (answer) {
    await saveResponse(studentToken, t.id, att.attempt_id, questionId, answer, "ANSWERED");
  }
  const result = await submitTest(studentToken, t.id, att.attempt_id);
  return result.scores.total;
}

run().catch(console.error);
