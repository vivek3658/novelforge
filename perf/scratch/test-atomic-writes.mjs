import fs from 'fs';
import { execSync } from 'child_process';
import autocannon from 'autocannon';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GATEWAY_URL = 'http://localhost:8080';

console.log('Logging in 20 users...');
const tokens = [];
for (let i = 1; i <= 20; i++) {
  const res = await fetch(`${GATEWAY_URL}/api/v1/identity/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: `perf_user_${i}`, password: 'Password123!' })
  });
  if (res.ok) {
    const data = await res.json();
    tokens.push({ username: `perf_user_${i}`, accessToken: data.accessToken });
  }
}
console.log(`Harvested ${tokens.length} tokens.`);

let globalTargetId = 2000;
let clientId = 0;

function getCount() {
  const out = execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -t -A -c "SELECT count(*) FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= 2000;"`, { encoding: 'utf-8' });
  return parseInt(out.trim() || '0', 10);
}

execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -c "DELETE FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= 2000;"`);

const before = getCount();
console.log('Before count:', before);

const res = await new Promise((resolve, reject) => {
  autocannon({
    url: GATEWAY_URL,
    connections: 5,
    amount: 50,
    pipelining: 1,
    setupClient: (client) => {
      const user = tokens[clientId++ % tokens.length];
      function nextReq() {
        const targetId = globalTargetId++;
        return {
          method: 'POST',
          path: `/api/v1/engagement/targets/POST/${targetId}/likes`,
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        };
      }
      client.setRequests([nextReq()]);
      client.on('response', () => {
        client.setRequests([nextReq()]);
      });
    }
  }, (err, res) => {
    if (err) return reject(err);
    resolve(res);
  });
});

const after = getCount();
console.log('After count:', after);
console.log('Net persisted:', after - before);
console.log('2xx:', res['2xx'], 'non2xx:', res.non2xx);
console.log('Match?', (after - before) === res['2xx']);
