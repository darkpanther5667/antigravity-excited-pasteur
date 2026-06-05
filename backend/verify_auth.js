import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const BASE_URL = "http://localhost:3001/api/v1";

function getLatestSmsCode(logContent, phone, prefix) {
  const lines = logContent.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(`To: ${phone}`) && lines[i].includes(prefix)) {
      const parts = lines[i].split(prefix);
      if (parts.length > 1) {
        return parts[1].trim();
      }
    }
  }
  return null;
}

async function run() {
  console.log("=== STARTING MODULE 5 AUTH VERIFICATION ===");

  const timestamp = Date.now();
  const email = `auth-test-${timestamp}@test.com`;
  const phone = `${String(timestamp).slice(-9)}9`; // 10 digit Indian number
  const password = "Password123!";

  console.log(`Generated test email: ${email}, phone: ${phone}`);

  // Helper to parse console logs
  // Since we run in development, let's trigger the action and mock or capture
  // the OTP by inspecting database directly!
  // Wait, the verification step 3 says "Check console after register: [DEV SMS] ...".
  // Since we cannot read the server stdout easily in real-time, we can query the DB to get the hashed OTP
  // or we can read the server's task log!
  // Wait, let's just query the database for the user's otpCode?
  // No, otpCode is hashed with bcrypt. How can we check the OTP?
  // Let's read the server log file! The logUri of task-779 is:
  // C:\Users\ma830\.gemini\antigravity\brain\01e38630-85ca-4236-a8b2-c2481739d950\.system_generated\tasks\task-779.log
  // We can write a helper to parse that log file! That is incredibly clever and fully automated.
  // Wait, is there an easier way? Since otpCode is bcrypt hashed, we could brute-force it since it is only 6 digits (100000 to 999999)!
  // A 6-digit brute force of bcrypt in Node would take some time (maybe 1-2 minutes).
  // Reading the log file is much faster! Let's read the log file using a file reading API or just execute it.
  // Wait, let's write a log parser or read the log file directly in the script since we know its location!
  // Yes! The log file path is `C:\\Users\\ma830\\.gemini\\antigravity\\brain\\01e38630-85ca-4236-a8b2-c2481739d950\\.system_generated\\tasks\\task-779.log`.
  // Wait, we can pass the server log path to the verify script as an environment variable or hardcode it. Let's find it.
  
  // Step 2: Register a new user
  console.log("\n--- Step 2: POST /api/v1/auth/register ---");
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Auth Tester", email, phone, password })
  });
  console.log(`Register response status: ${regRes.status} (Expected: 201)`);
  const regData = await regRes.json();
  console.log(`Register data:`, regData);
  const userId = regData.data.user_id;

  // Duplicate email check
  const regDupEmailRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Auth Tester 2", email, phone: "9876543210", password })
  });
  const regDupEmailData = await regDupEmailRes.json();
  console.log(`Duplicate Email response status: ${regDupEmailRes.status} (Expected: 400), Error: "${regDupEmailData.error}"`);

  // Duplicate phone check
  const regDupPhoneRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Auth Tester 3", email: "other@test.com", phone, password })
  });
  const regDupPhoneData = await regDupPhoneRes.json();
  console.log(`Duplicate Phone response status: ${regDupPhoneRes.status} (Expected: 400), Error: "${regDupPhoneData.error}"`);

  // Weak password check
  const regWeakPassRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Auth Tester 4", email: "weak@test.com", phone: "9876543210", password: "password" })
  });
  const regWeakPassData = await regWeakPassRes.json();
  console.log(`Weak Password response status: ${regWeakPassRes.status} (Expected: 400), Error: "${regWeakPassData.error}"`);

  // Step 3: Get OTP from log
  console.log("\n--- Step 3: Check OTP from logs ---");
  // Let's read the server log to extract the OTP
  const fs = await import('fs');
  const path = await import('path');
  const logPath = "C:\\Users\\ma830\\.gemini\\antigravity\\brain\\01e38630-85ca-4236-a8b2-c2481739d950\\.system_generated\\tasks\\task-904.log";
  
  // Wait a moment for server to write log
  await new Promise(r => setTimeout(r, 1000));
  const logContent = fs.readFileSync(logPath, 'utf8');
  const otp = getLatestSmsCode(logContent, phone, "Your OTP is ");
  if (!otp) {
    throw new Error("Could not find OTP in log file!");
  }
  console.log(`Extracted OTP from log: ${otp}`);

  // Step 4: POST /api/v1/auth/send-otp with already verified -> 400 (Wait, not verified yet, so let's verify first then test)
  console.log("\n--- Step 5: POST /api/v1/auth/verify-otp ---");
  // Wrong OTP check
  const verifyWrongRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp: "999999" })
  });
  const verifyWrongData = await verifyWrongRes.json();
  console.log(`Verify Wrong OTP status: ${verifyWrongRes.status} (Expected: 400), Error: "${verifyWrongData.error}"`);

  // Correct OTP check
  const verifyCorrectRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp })
  });
  console.log(`Verify Correct OTP status: ${verifyCorrectRes.status} (Expected: 200)`);
  const verifyCorrectData = await verifyCorrectRes.json();
  const { access_token, refresh_token } = verifyCorrectData.data;
  console.log(`Tokens generated successfully: access_token present = ${!!access_token}, refresh_token present = ${!!refresh_token}`);

  // Reuse OTP check
  const verifyReuseRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp })
  });
  const verifyReuseData = await verifyReuseRes.json();
  console.log(`Verify Reuse OTP status: ${verifyReuseRes.status} (Expected: 400), Error: "${verifyReuseData.error}"`);

  // Step 4: send-otp on already verified
  console.log("\n--- Step 4: POST /api/v1/auth/send-otp (verified check) ---");
  const sendVerifiedRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  const sendVerifiedData = await sendVerifiedRes.json();
  console.log(`Send OTP on verified phone status: ${sendVerifiedRes.status} (Expected: 400), Error: "${sendVerifiedData.error}"`);

  // Step 6: POST /api/v1/auth/login
  console.log("\n--- Step 6: POST /api/v1/auth/login ---");
  // Email Login
  const loginEmailRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email, password })
  });
  console.log(`Email Login status: ${loginEmailRes.status} (Expected: 200)`);

  // Phone Login
  const loginPhoneRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: phone, password })
  });
  console.log(`Phone Login status: ${loginPhoneRes.status} (Expected: 200)`);
  const loginData = await loginPhoneRes.json();
  const sessionToken = loginData.data.access_token;
  const sessionRefreshToken = loginData.data.refresh_token;

  // Wrong Password
  const loginWrongRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: phone, password: "WrongPassword!" })
  });
  const loginWrongData = await loginWrongRes.json();
  console.log(`Wrong Password Login status: ${loginWrongRes.status} (Expected: 401), Error: "${loginWrongData.error}"`);

  // Unverified User Login (Register another user, don't verify OTP, and try login)
  const unverifiedEmail = `unverified-${timestamp}@test.com`;
  const unverifiedPhone = `${String(timestamp).slice(-9)}8`;
  await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Unverified Tester", email: unverifiedEmail, phone: unverifiedPhone, password })
  });
  const loginUnverifiedRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: unverifiedPhone, password })
  });
  const loginUnverifiedData = await loginUnverifiedRes.json();
  console.log(`Unverified Login status: ${loginUnverifiedRes.status} (Expected: 403), Error: "${loginUnverifiedData.error}"`);

  // Step 7: GET /api/v1/auth/me
  console.log("\n--- Step 7: GET /api/v1/auth/me ---");
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  console.log(`GET /me status: ${meRes.status} (Expected: 200)`);
  const meData = await meRes.json();
  console.log(`GET /me body:`, meData.data);
  console.log(`passwordHash present? ${meData.data.passwordHash !== undefined}`);
  console.log(`otpCode present? ${meData.data.otpCode !== undefined}`);
  console.log(`refreshToken present? ${meData.data.refreshToken !== undefined}`);

  // Step 8: POST /api/v1/auth/refresh
  console.log("\n--- Step 8: POST /api/v1/auth/refresh ---");
  // Valid token refresh
  const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: sessionRefreshToken })
  });
  console.log(`Refresh status: ${refreshRes.status} (Expected: 200)`);
  const refreshData = await refreshRes.json();
  const rotatedRefreshToken = refreshData.data.refresh_token;
  console.log(`New refresh token returned: ${!!rotatedRefreshToken}`);
  console.log(`Are tokens identical? ${sessionRefreshToken === rotatedRefreshToken}`);
  console.log(`sessionRefreshToken: ${sessionRefreshToken}`);
  console.log(`rotatedRefreshToken: ${rotatedRefreshToken}`);

  // Old refresh token (after rotation)
  const refreshOldRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: sessionRefreshToken }) // old one
  });
  const refreshOldData = await refreshOldRes.json();
  console.log(`Old Refresh status: ${refreshOldRes.status} (Expected: 401), Error: "${refreshOldData.error}"`);

  // Tampered refresh token
  const refreshTamperedRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rotatedRefreshToken + "tamper" })
  });
  const refreshTamperedData = await refreshTamperedRes.json();
  console.log(`Tampered Refresh status: ${refreshTamperedRes.status} (Expected: 401), Error: "${refreshTamperedData.error}"`);

  // Step 9: POST /api/v1/auth/logout
  console.log("\n--- Step 9: POST /api/v1/auth/logout ---");
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${sessionToken}` }
  });
  console.log(`Logout status: ${logoutRes.status} (Expected: 200)`);

  const refreshAfterLogoutRes = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: rotatedRefreshToken })
  });
  const refreshAfterLogoutData = await refreshAfterLogoutRes.json();
  console.log(`Refresh after logout status: ${refreshAfterLogoutRes.status} (Expected: 401), Error: "${refreshAfterLogoutData.error}"`);

  // Step 10: Access token expiry simulation
  console.log("\n--- Step 10: Access token expiry simulation ---");
  const tempToken = jwt.sign(
    { id: userId, role: "STUDENT", name: "Auth Tester" },
    process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
    { expiresIn: '1s' }
  );
  
  console.log("Waiting 2 seconds for token to expire...");
  await new Promise(r => setTimeout(r, 2000));
  
  const expiredRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { "Authorization": `Bearer ${tempToken}` }
  });
  const expiredData = await expiredRes.json();
  console.log(`Expired token status: ${expiredRes.status} (Expected: 401), Error: "${expiredData.error}"`);

  // Step 11: POST /api/v1/auth/forgot-password
  console.log("\n--- Step 11: POST /api/v1/auth/forgot-password ---");
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone })
  });
  console.log(`Forgot Password status: ${forgotRes.status} (Expected: 200)`);
  const forgotData = await forgotRes.json();
  console.log(`Forgot Password data:`, forgotData);

  // Silently success check for non-existent phone
  const forgotNonExistRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9000000000" })
  });
  console.log(`Forgot Password non-existent status: ${forgotNonExistRes.status} (Expected: 200)`);

  // Extract reset token from logs
  await new Promise(r => setTimeout(r, 1000));
  const logContentForgot = fs.readFileSync(logPath, 'utf8');
  const resetToken = getLatestSmsCode(logContentForgot, phone, "Your JEE Platform password reset code: ");
  if (!resetToken) {
    throw new Error("Could not find reset token in log file!");
  }
  console.log(`Extracted Reset Token: ${resetToken}`);

  // Step 12: POST /api/v1/auth/reset-password
  console.log("\n--- Step 12: POST /api/v1/auth/reset-password ---");
  const newPassword = "NewPassword123!";
  const resetRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, reset_token: resetToken, new_password: newPassword })
  });
  console.log(`Reset Password status: ${resetRes.status} (Expected: 200)`);

  // Reuse reset token check
  const resetReuseRes = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, reset_token: resetToken, new_password: newPassword })
  });
  const resetReuseData = await resetReuseRes.json();
  console.log(`Reset Password Reuse status: ${resetReuseRes.status} (Expected: 400), Error: "${resetReuseData.error}"`);

  // Step 13: Login after password reset
  console.log("\n--- Step 13: POST /api/v1/auth/login after reset ---");
  const loginOldRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: phone, password }) // old password
  });
  const loginOldData = await loginOldRes.json();
  console.log(`Login with Old Password status: ${loginOldRes.status} (Expected: 401), Error: "${loginOldData.error}"`);

  const loginNewRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: phone, password: newPassword }) // new password
  });
  console.log(`Login with New Password status: ${loginNewRes.status} (Expected: 200)`);

  // Step 14: Confirm dev-token still works
  console.log("\n--- Step 14: Confirm dev-token works ---");
  const devRes = await fetch(`${BASE_URL}/auth/dev-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "ADMIN" })
  });
  console.log(`Dev Token status in development: ${devRes.status} (Expected: 200)`);

  console.log("=== VERIFICATION COMPLETED ===");
}

run().catch(console.error);
