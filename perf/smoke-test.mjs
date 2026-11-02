import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'tokens.json')));
const token = tokens[0].accessToken;

console.log(`--- Running NovelForge Pre-Load Smoke Tests against ${GATEWAY_URL} ---`);

const tests = [
  {
    name: '1. Gateway Health',
    url: `${GATEWAY_URL}/actuator/health`,
    options: { method: 'GET' },
    expectedStatus: 200
  },
  {
    name: '2. Novel Search (Public GET)',
    url: `${GATEWAY_URL}/api/v1/novels/search?page=0&size=20`,
    options: { method: 'GET' },
    expectedStatus: 200,
    check: (data) => data.content && data.content.length > 0
  },
  {
    name: '3. Novel Detail (Public GET)',
    url: `${GATEWAY_URL}/api/v1/novels/1`,
    options: { method: 'GET' },
    expectedStatus: 200,
    check: (data) => data.id === 1
  },
  {
    name: '4. Chapter List (Public GET)',
    url: `${GATEWAY_URL}/api/v1/novels/1/chapters`,
    options: { method: 'GET' },
    expectedStatus: 200,
    check: (data) => data.content && data.content.length > 0
  },
  {
    name: '5. Single Chapter with Blocks (Public GET MongoDB)',
    url: `${GATEWAY_URL}/api/v1/novels/1/chapters/c1a11111-1111-1111-1111-111111111111`,
    options: { method: 'GET' },
    expectedStatus: 200,
    check: (data) => data.blocks && data.blocks.length > 0
  },
  {
    name: '6. Authenticated Read (Auth Me)',
    url: `${GATEWAY_URL}/api/v1/identity/auth/me`,
    options: {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    },
    expectedStatus: 200,
    check: (data) => !!data.username
  },
  {
    name: '7. Login Authentication (Identity CPU)',
    url: `${GATEWAY_URL}/api/v1/identity/auth/login`,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'perf_user_1', password: 'Password123!' })
    },
    expectedStatus: 200,
    check: (data) => !!data.accessToken
  },
  {
    name: '8. Public Social Posts (Engagement Public GET)',
    url: `${GATEWAY_URL}/api/v1/engagement/public/posts?page=0&size=20`,
    options: { method: 'GET' },
    expectedStatus: 200,
    check: (data) => data.content && data.content.length > 0
  },
  {
    name: '9. Authenticated Social Like (Write Path)',
    url: `${GATEWAY_URL}/api/v1/engagement/targets/POST/1/likes`,
    options: {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    },
    expectedStatus: 200,
    check: (data) => data.count !== undefined
  }
];

let failed = 0;
for (const test of tests) {
  try {
    const res = await fetch(test.url, test.options);
    if (res.status !== test.expectedStatus) {
      console.error(`FAIL: ${test.name} - Expected ${test.expectedStatus}, got ${res.status}`);
      failed++;
      continue;
    }
    const data = await res.json().catch(() => null);
    if (test.check && data && !test.check(data)) {
      console.error(`FAIL: ${test.name} - Assertion failed on payload`, data);
      failed++;
      continue;
    }
    console.log(`PASS: ${test.name} [HTTP ${res.status}]`);
  } catch (err) {
    console.error(`ERROR: ${test.name} - ${err.message}`);
    failed++;
  }
}

if (failed === 0) {
  console.log('=== ALL SMOKE TESTS PASSED (100% HEALTHY) ===');
  process.exit(0);
} else {
  console.error(`=== ${failed} SMOKE TESTS FAILED ===`);
  process.exit(1);
}
