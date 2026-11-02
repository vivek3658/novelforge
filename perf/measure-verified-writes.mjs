import autocannon from 'autocannon';
import { execSync } from 'child_process';
import fs from 'fs';
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

function getLikesCount() {
  const out = execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -t -A -c "SELECT count(*) FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= 100;"`, { encoding: 'utf-8' });
  return parseInt(out.trim() || '0', 10);
}

function resetLikes() {
  execSync(`docker exec novelforge-postgres psql -U postgres -d engagementDB -c "DELETE FROM engagement_likes WHERE target_id ~ '^[0-9]+$' AND target_id::int >= 100;"`, { stdio: 'ignore' });
}

function getHikariMetrics(service, port) {
  try {
    const acquireStr = execSync(`docker exec novelforge-server-${service}-1 wget -qO- http://localhost:${port}/actuator/metrics/hikaricp.connections.acquire`, { encoding: 'utf-8' });
    const pendingStr = execSync(`docker exec novelforge-server-${service}-1 wget -qO- http://localhost:${port}/actuator/metrics/hikaricp.connections.pending`, { encoding: 'utf-8' });
    const activeStr = execSync(`docker exec novelforge-server-${service}-1 wget -qO- http://localhost:${port}/actuator/metrics/hikaricp.connections.active`, { encoding: 'utf-8' });
    
    const acquire = JSON.parse(acquireStr);
    const pending = JSON.parse(pendingStr);
    const active = JSON.parse(activeStr);

    return {
      acquireCount: acquire.measurements?.find(m => m.statistic === 'COUNT')?.value || 0,
      acquireTotalTime: acquire.measurements?.find(m => m.statistic === 'TOTAL_TIME')?.value || 0,
      pendingThreads: pending.measurements?.find(m => m.statistic === 'VALUE')?.value || 0,
      activeConnections: active.measurements?.find(m => m.statistic === 'VALUE')?.value || 0
    };
  } catch (e) {
    return { acquireCount: 0, acquireTotalTime: 0, pendingThreads: 0, activeConnections: 0 };
  }
}

async function runBenchmark() {
  console.log('\n======================================================');
  console.log('STARTING VERIFIED PERSISTENT WRITE-PATH BENCHMARK');
  console.log('======================================================');

  resetLikes();
  const rowsInitial = getLikesCount();
  console.log(`Initial likes rows in range [100, 2500]: ${rowsInitial}`);

  // Build 20,000 distinct requests cycling through (20 users x 1000 targets)
  let requestIdx = 0;
  const targetStart = 100;
  const totalTargets = 1500;
  
  const requests = [];
  for (let t = 0; t < totalTargets; t++) {
    for (let u = 0; u < tokens.length; u++) {
      requests.push({
        method: 'POST',
        path: `/api/v1/engagement/targets/POST/${targetStart + t}/likes`,
        headers: { Authorization: `Bearer ${tokens[u].accessToken}` }
      });
    }
  }

  console.log(`Pre-generated ${requests.length} distinct (user, target) write requests.`);

  // Test across connections on 1x
  const results = {};
  for (const c of [10, 50, 100, 200]) {
    console.log(`\n--- Testing ${c} Connections (Duration: 5s) ---`);
    resetLikes();
    const beforeCount = getLikesCount();
    const hikariBefore = getHikariMetrics('engagement-service', 8084);

    const res = await new Promise((resolve, reject) => {
      autocannon({
        url: GATEWAY_URL,
        requests,
        connections: c,
        duration: 5,
        pipelining: 1
      }, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

    const afterCount = getLikesCount();
    const hikariAfter = getHikariMetrics('engagement-service', 8084);
    const netPersisted = afterCount - beforeCount;

    const stats = {
      connections: c,
      rps: res.requests.average,
      twoXx: res['2xx'],
      non2xx: res.non2xx,
      timeouts: res.timeouts,
      errors: res.errors,
      meanLatency: res.latency.mean,
      p50: res.latency.p50,
      p97_5: res.latency.p97_5,
      p99: res.latency.p99,
      max: res.latency.max,
      rowsBefore: beforeCount,
      rowsAfter: afterCount,
      netRowsPersisted: netPersisted,
      persistenceMatch: netPersisted === res['2xx'],
      hikari: {
        newAcquisitions: hikariAfter.acquireCount - hikariBefore.acquireCount,
        acquireTimeSec: (hikariAfter.acquireTotalTime - hikariBefore.acquireTotalTime).toFixed(2),
        activeConnections: hikariAfter.activeConnections,
        pendingThreads: hikariAfter.pendingThreads
      }
    };

    results[c] = stats;
    console.log(`  -> Throughput: ${stats.rps.toFixed(1)} req/s`);
    console.log(`  -> Status codes: 2xx=${stats.twoXx} | non-2xx=${stats.non2xx} | timeouts=${stats.timeouts}`);
    console.log(`  -> Persistence: Before=${stats.rowsBefore} | After=${stats.rowsAfter} | Net Persisted=${stats.netRowsPersisted} (${stats.persistenceMatch ? 'MATCHES 2xx' : 'MISMATCH'})`);
    console.log(`  -> Latency: mean=${stats.meanLatency.toFixed(1)}ms | p50=${stats.p50}ms | p99=${stats.p99}ms | max=${stats.max}ms`);
    console.log(`  -> HikariCP: Acquired=${stats.hikari.newAcquisitions} | Acquire Time=${stats.hikari.acquireTimeSec}s | Active=${stats.hikari.activeConnections} | Pending=${stats.hikari.pendingThreads}`);
  }

  fs.writeFileSync(path.join(__dirname, 'results', 'verified-writes.json'), JSON.stringify(results, null, 2));
  console.log(`\nResults saved to perf/results/verified-writes.json`);
}

runBenchmark().catch(console.error);
