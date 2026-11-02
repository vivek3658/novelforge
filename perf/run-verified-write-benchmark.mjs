import fs from 'fs';
import { execSync } from 'child_process';
import autocannon from 'autocannon';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';

// 1. Refresh fresh JWT tokens for all 20 users
console.log('>>> Refreshing 20 user tokens via /api/v1/identity/auth/login...');
const tokens = [];
for (let i = 1; i <= 20; i++) {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/identity/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: `perf_user_${i}`, password: 'Password123!' })
    });
    if (res.ok) {
      const data = await res.json();
      tokens.push({ username: `perf_user_${i}`, accessToken: data.accessToken });
    }
  } catch (e) {
    console.error(`Error logging in user ${i}:`, e.message);
  }
}
fs.writeFileSync(path.join(__dirname, 'seed', 'tokens.json'), JSON.stringify(tokens, null, 2));
console.log(`Successfully harvested ${tokens.length} fresh valid JWT tokens.`);

function getLikesCount(minTargetId) {
  const out = execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -t -A -c "SELECT count(*) FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= ${minTargetId};"`, { encoding: 'utf-8' });
  return parseInt(out.trim() || '0', 10);
}

function resetLikes(minTargetId) {
  execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -c "DELETE FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= ${minTargetId};"`, { stdio: 'ignore' });
}

let baseTargetId = 5000;

async function runBenchmark() {
  console.log('\n========================================================================');
  console.log('STARTING RIGOROUS VERIFIED PERSISTENT WRITE BENCHMARK');
  console.log('  Invariant: 1 HTTP 2xx == 1 SQL INSERT in engagement_likes');
  console.log('========================================================================\n');

  const results = {};

  for (const c of [10, 50, 100, 200]) {
    const minTargetId = baseTargetId;
    baseTargetId += 10000; // isolate target space per concurrency run

    resetLikes(minTargetId);
    const beforeCount = getLikesCount(minTargetId);
    let currentTargetId = minTargetId;
    let clientId = 0;
    let distinctPairsCount = 0;

    console.log(`--- Testing Concurrency ${c} (Duration: 5s, Initial rows: ${beforeCount}) ---`);

    const res = await new Promise((resolve, reject) => {
      autocannon({
        url: GATEWAY_URL,
        connections: c,
        duration: 5,
        pipelining: 1,
        setupClient: (client) => {
          const user = tokens[clientId++ % tokens.length];
          function nextReq() {
            const targetId = currentTargetId++;
            distinctPairsCount++;
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
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const afterCount = getLikesCount(minTargetId);
    const netPersisted = afterCount - beforeCount;
    const persistenceMatch = netPersisted === res['2xx'];
    const littlesLawExpected = res.latency.mean > 0 ? (c / (res.latency.mean / 1000)) : 0;
    const littlesLawDeltaPct = littlesLawExpected > 0 ? Math.abs((res.requests.average - littlesLawExpected) / littlesLawExpected * 100).toFixed(1) : 'N/A';

    const cellData = {
      concurrency: c,
      topology: '1x container (1 vCPU, 768 MB)',
      rps: res.requests.average,
      twoXx: res['2xx'],
      non2xx: res.non2xx,
      timeouts: res.timeouts,
      errors: res.errors,
      distinctPairsSent: distinctPairsCount,
      rowsBefore: beforeCount,
      rowsAfter: afterCount,
      netRowsPersisted: netPersisted,
      persistenceMatch: persistenceMatch,
      latency: {
        mean: res.latency.mean,
        p50: res.latency.p50,
        p97_5: res.latency.p97_5,
        p99: res.latency.p99,
        max: res.latency.max
      },
      littlesLaw: {
        concurrency: c,
        meanLatencyMs: res.latency.mean,
        expectedRps: littlesLawExpected.toFixed(1),
        actualRps: res.requests.average.toFixed(1),
        deviationPct: `${littlesLawDeltaPct}%`
      }
    };

    results[c] = cellData;

    console.log(`  -> Throughput: ${cellData.rps.toFixed(1)} req/s`);
    console.log(`  -> Status codes: 2xx=${cellData.twoXx} | non-2xx=${cellData.non2xx} | timeouts=${cellData.timeouts}`);
    console.log(`  -> Distinct pairs: ${distinctPairsCount} | Rows Before: ${beforeCount} | Rows After: ${afterCount}`);
    console.log(`  -> Net DB Persisted: ${netPersisted} (${persistenceMatch ? '100% MATCH WITH 2xx' : 'MISMATCH'})`);
    console.log(`  -> Latency: mean=${cellData.latency.mean.toFixed(1)}ms | p50=${cellData.latency.p50}ms | p99=${cellData.latency.p99}ms | max=${cellData.latency.max}ms`);
    console.log(`  -> Little's Law cross-check: Expected=${littlesLawExpected.toFixed(1)} req/s | Actual=${cellData.rps.toFixed(1)} req/s (Δ ${littlesLawDeltaPct}%)\n`);
  }

  const outputPath = path.join(__dirname, 'results', 'verified-writes-final.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`>>> All verified persistent write results written to ${outputPath}`);
}

runBenchmark().catch(console.error);
