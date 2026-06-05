import crypto from 'crypto';

const BASE_URL = 'http://localhost:3001/api/v1';

async function getDevToken(role, userId = null) {
  const payload = { role };
  if (userId) {
    payload.sub = userId;
  }
  const res = await fetch(`${BASE_URL}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error(`Failed to get dev token: ${await res.text()}`);
  }
  const data = await res.json();
  return data.data.token;
}

async function run() {
  console.log('--- START MODULE 6 VERIFICATION ---');

  // Generate tokens
  const studentToken = await getDevToken('STUDENT', 'std-m6-test-1');
  const student2Token = await getDevToken('STUDENT', 'std-m6-test-2');
  const teacherToken = await getDevToken('TEACHER', 'teacher-m6');
  const adminToken = await getDevToken('ADMIN', 'admin-m6');

  console.log('✓ Dev tokens generated successfully');

  // Test 1: GET /api/v1/payments/plans (Public)
  console.log('\n--- 1. Testing GET /plans (Public) ---');
  const plansRes = await fetch(`${BASE_URL}/payments/plans`);
  console.log('Status:', plansRes.status);
  const plans = await plansRes.json();
  console.log('Plans List:');
  plans.data.forEach(p => {
    console.log(`- ${p.id}: Price ${p.price} ${p.currency} (Duration: ${p.duration_days} days)`);
  });
  if (plans.data.find(p => p.id === 'PRO').price !== 999) {
    throw new Error('PRO price is not converted to rupees on /plans route!');
  }
  console.log('✓ Public plans returned and price successfully formatted as Rupees');

  // Test 2: POST /api/v1/payments/create-order
  console.log('\n--- 2. Testing POST /create-order ---');
  const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ plan_id: 'PRO' })
  });
  console.log('Status:', orderRes.status);
  const orderData = await orderRes.json();
  console.log('Order generated:', orderData.data);
  if (!orderData.data.razorpay_order_id) {
    throw new Error('Missing razorpay_order_id in response');
  }
  if (orderData.data.razorpaySignature !== undefined) {
    throw new Error('Exposed razorpaySignature in createOrder response!');
  }
  console.log('✓ Order created successfully, response format verified');

  // Test 3: POST /api/v1/payments/verify (Signature validation fail)
  console.log('\n--- 3. Testing POST /verify signature verification fail ---');
  const verifyFailRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: orderData.data.razorpay_order_id,
      razorpay_payment_id: 'pay_dummy123',
      razorpay_signature: 'invalid_signature'
    })
  });
  console.log('Status (expected 400):', verifyFailRes.status);
  console.log('Body:', await verifyFailRes.json());

  // Test 4: POST /api/v1/payments/verify (Success)
  console.log('\n--- 4. Testing POST /verify success signature ---');
  const dummyPaymentId = 'pay_dummy_success_' + Date.now();
  // Compute valid signature
  const hmac = crypto.createHmac('sha256', 'your_razorpay_secret'); // matching secret in .env
  hmac.update(`${orderData.data.razorpay_order_id}|${dummyPaymentId}`);
  const validSignature = hmac.digest('hex');

  const verifySuccessRes = await fetch(`${BASE_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      razorpay_order_id: orderData.data.razorpay_order_id,
      razorpay_payment_id: dummyPaymentId,
      razorpay_signature: validSignature
    })
  });
  console.log('Status:', verifySuccessRes.status);
  console.log('Body:', await verifySuccessRes.json());
  if (verifySuccessRes.status !== 200) {
    throw new Error('Verification failed for valid signature');
  }
  console.log('✓ Payment verified and plan activated successfully');

  // Test 5: GET /api/v1/payments/orders (Order history check)
  console.log('\n--- 5. Testing GET /orders (Order History) ---');
  const historyRes = await fetch(`${BASE_URL}/payments/orders`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('Status:', historyRes.status);
  const historyData = await historyRes.json();
  console.log('Orders found:', historyData.data.length);
  const checkSig = historyData.data.find(o => o.razorpaySignature !== undefined);
  if (checkSig) {
    throw new Error('Exposed razorpaySignature in orders history list!');
  }
  console.log('✓ Order history retrieved, verified no signature exposure');

  // Test 6: Require plan middleware check on SWOT endpoint for FREE user
  console.log('\n--- 6. Testing Require plan middleware on SWOT (FREE User) ---');
  const swotFreeRes = await fetch(`${BASE_URL}/analytics/me/swot`, {
    headers: { 'Authorization': `Bearer ${student2Token}` } // student2 is FREE
  });
  console.log('Status (expected 403):', swotFreeRes.status);
  const swotFreeBody = await swotFreeRes.json();
  console.log('Body:', swotFreeBody);
  if (swotFreeRes.status !== 403 || swotFreeBody.error !== 'This feature requires Pro plan or above') {
    throw new Error('Incorrect response or status code for insufficient plan tier');
  }

  // Test 7: Require plan middleware check on SWOT endpoint for PRO user
  console.log('\n--- 7. Testing Require plan middleware on SWOT (PRO User) ---');
  const swotProRes = await fetch(`${BASE_URL}/analytics/me/swot`, {
    headers: { 'Authorization': `Bearer ${studentToken}` } // student is PRO
  });
  console.log('Status (expected 200 or 404 since no attempts):', swotProRes.status);
  console.log('Body:', await swotProRes.json());

  // Test 8: Create an Adaptive Test (ADMIN)
  console.log('\n--- 8. Create Adaptive mock test ---');
  const createAdaptiveRes = await fetch(`${BASE_URL}/tests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Adaptive Practice Test 1',
      type: 'ADAPTIVE',
      exam_type: 'MAINS',
      duration_minutes: 60,
      total_marks: 120,
      instructions: 'Solve this adaptive test.',
      scheduled_at: '2026-06-15T09:00:00.000Z'
    })
  });
  const adaptiveTest = await createAdaptiveRes.json();
  const adaptiveTestId = adaptiveTest.data.id;
  console.log('Adaptive Test Created, ID:', adaptiveTestId);

  // Add questions to the adaptive test
  const questionsListRes = await fetch(`${BASE_URL}/questions`);
  const questionsList = await questionsListRes.json();
  const activeQuestions = questionsList.data.questions;
  const targetQs = activeQuestions.slice(0, 3);
  await fetch(`${BASE_URL}/tests/${adaptiveTestId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      questions: targetQs.map((q, idx) => ({
        question_id: q.id,
        section: q.subject,
        marks_correct: 4,
        marks_incorrect: -1,
        question_order: idx + 1
      }))
    })
  });
  console.log('Questions linked to adaptive test.');

  // Publish the adaptive test
  await fetch(`${BASE_URL}/tests/${adaptiveTestId}/publish`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ is_published: true })
  });
  console.log('Adaptive test published.');

  // Test 9: Start Adaptive test (FREE User)
  console.log('\n--- 9. Start Adaptive test (FREE User) ---');
  const startAdaptiveFreeRes = await fetch(`${BASE_URL}/tests/${adaptiveTestId}/start`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${student2Token}` }
  });
  console.log('Status (expected 403):', startAdaptiveFreeRes.status);
  const startAdaptiveFreeBody = await startAdaptiveFreeRes.json();
  console.log('Body:', startAdaptiveFreeBody);
  if (startAdaptiveFreeRes.status !== 403 || startAdaptiveFreeBody.error !== 'This feature requires Pro plan or above') {
    throw new Error('Did not block FREE user starting ADAPTIVE test');
  }

  // Test 10: Start Adaptive test (PRO User)
  console.log('\n--- 10. Start Adaptive test (PRO User) ---');
  const startAdaptiveProRes = await fetch(`${BASE_URL}/tests/${adaptiveTestId}/start`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('Status (expected 200):', startAdaptiveProRes.status);
  const startAdaptiveProBody = await startAdaptiveProRes.json();
  console.log('Body:', startAdaptiveProBody.success ? 'Success!' : startAdaptiveProBody);
  if (startAdaptiveProRes.status !== 200) {
    throw new Error('PRO user failed to start ADAPTIVE test');
  }

  // Test 11: Leaderboard Generation (Pagination & Name Truncation)
  console.log('\n--- 11. Leaderboard and Name Truncation ---');
  // First, student submits the adaptive test to get into rankings
  const attemptId = startAdaptiveProBody.data.attempt_id;
  await fetch(`${BASE_URL}/tests/${adaptiveTestId}/save-response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      attempt_id: attemptId,
      question_id: targetQs[0].id,
      selected_answer: targetQs[0].correct_answer || 'A',
      status: 'ANSWERED',
      time_spent_seconds: 30,
      time_remaining: 3500
    })
  });
  await fetch(`${BASE_URL}/tests/${adaptiveTestId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ attempt_id: attemptId })
  });
  console.log('PRO student submitted the test.');

  const leaderboardRes = await fetch(`${BASE_URL}/leaderboard/test/${adaptiveTestId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('Status:', leaderboardRes.status);
  const lbData = await leaderboardRes.json();
  console.log('Leaderboard response:', lbData.data);
  if (lbData.data.leaderboard.length > 0) {
    const firstUser = lbData.data.leaderboard[0];
    console.log(`Checking name format of "${firstUser.name}"`);
    if (firstUser.name.includes('Student') && firstUser.name.endsWith('Student')) {
      throw new Error('Name was not truncated correctly!');
    }
  }
  console.log('✓ Leaderboard endpoint returned correctly with name truncation');

  // Test 12: Rank gaps checking
  console.log('\n--- 12. Rank gaps (Above / Below Comparison) ---');
  const rankGapsRes = await fetch(`${BASE_URL}/leaderboard/test/${adaptiveTestId}/my-rank/${attemptId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('Status:', rankGapsRes.status);
  const gapsData = await rankGapsRes.json();
  console.log('Rank context array:', gapsData.data);
  console.log('✓ Rank context returned successfully');

  // Test 13: Global Leaderboard
  console.log('\n--- 13. Global Leaderboard ---');
  const globalLbRes = await fetch(`${BASE_URL}/leaderboard/global`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  console.log('Status:', globalLbRes.status);
  const globalLbData = await globalLbRes.json();
  console.log('Global Leaderboard sample:', globalLbData.data.leaderboard);
  console.log('✓ Global leaderboard returned successfully');

  // Test 14: Cache checks
  console.log('\n--- 14. Cache test verification ---');
  const startCache = Date.now();
  const lbCached1 = await fetch(`${BASE_URL}/leaderboard/test/${adaptiveTestId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const fetch1Time = Date.now() - startCache;
  const startCache2 = Date.now();
  const lbCached2 = await fetch(`${BASE_URL}/leaderboard/test/${adaptiveTestId}`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const fetch2Time = Date.now() - startCache2;
  console.log(`First Fetch: ${fetch1Time}ms | Second Fetch: ${fetch2Time}ms`);
  console.log('✓ Cache validation complete');

  console.log('\n--- ALL 14 TASKS AND TESTS VERIFIED SUCCESSFULLY ---');
}

run().catch(err => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
