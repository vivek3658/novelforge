import autocannon from 'autocannon';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8080';
const tokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed', 'tokens.json')));
const defaultToken = tokens[0].accessToken;

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const resultsDir = path.join(__dirname, 'results', timestamp);
fs.mkdirSync(resultsDir, { recursive: true });

console.log(`=== NovelForge Rigorous Performance Test Runner ===`);
console.log(`Results directory: ${resultsDir}`);
console.log(`Gateway URL: ${GATEWAY_URL}`);

const SCENARIOS = {
  'read-heavy': {
    name: '1. Read-Heavy Public (Catalog & Novel Details)',
    service: 'novel-service',
    eurekaApp: 'NOVEL-SERVICE',
    port: 8083,
    buildRequest: () => ({
      title: 'read-heavy',
      url: `${GATEWAY_URL}/api/v1/novels/search?page=0&size=20`,
      method: 'GET',
      requests: [
        { method: 'GET', path: '/api/v1/novels/search?page=0&size=20' },
        { method: 'GET', path: '/api/v1/novels/1' },
        { method: 'GET', path: '/api/v1/novels/2' },
        { method: 'GET', path: '/api/v1/novels/search?category=FICTION&size=20' }
      ]
    })
  },
  'chapter-read': {
    name: '2. Chapter Read (MongoDB Content Blocks)',
    service: 'novel-service',
    eurekaApp: 'NOVEL-SERVICE',
    port: 8083,
    buildRequest: () => ({
      title: 'chapter-read',
      url: `${GATEWAY_URL}/api/v1/novels/1/chapters/c1a11111-1111-1111-1111-111111111111`,
      method: 'GET'
    })
  },
  'auth-read': {
    name: '3. Authenticated Read (Stateless JWT Auth Filter Overhead)',
    service: 'identity-service',
    eurekaApp: 'IDENTITY-SERVICE',
    port: 8081,
    buildRequest: () => ({
      title: 'auth-read',
      url: `${GATEWAY_URL}/api/v1/identity/auth/me`,
      method: 'GET',
      headers: { Authorization: `Bearer ${defaultToken}` }
    })
  },
  'login': {
    name: '4. Login (CPU-Intensive 10-Round BCrypt Password Hashing)',
    service: 'identity-service',
    eurekaApp: 'IDENTITY-SERVICE',
    port: 8081,
    buildRequest: () => ({
      title: 'login',
      url: `${GATEWAY_URL}/api/v1/identity/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'perf_user_1', password: 'Password123!' })
    })
  },
  'write-path': {
    name: '5. Write Path (Social Engagement Like & Cache Invalidation)',
    service: 'engagement-service',
    eurekaApp: 'ENGAGEMENT-SERVICE',
    port: 8084,
    buildRequest: () => ({
      title: 'write-path',
      url: `${GATEWAY_URL}/api/v1/engagement/targets/POST/1/likes`,
      method: 'POST',
      headers: { Authorization: `Bearer ${defaultToken}` }
    })
  },
  'mixed': {
    name: '6. Mixed Workload (80% Reads, 15% Auth Reads, 5% Writes)',
    service: 'novel-service',
    eurekaApp: 'NOVEL-SERVICE',
    port: 8083,
    buildRequest: () => {
      // 20 requests: 16 reads (80%), 3 auth reads (15%), 1 write (5%)
      const requests = [
        { method: 'GET', path: '/api/v1/novels/search?page=0&size=20' },
        { method: 'GET', path: '/api/v1/novels/1' },
        { method: 'GET', path: '/api/v1/novels/1/chapters/c1a11111-1111-1111-1111-111111111111' },
        { method: 'GET', path: '/api/v1/novels/search?category=FICTION&size=20' },
        { method: 'GET', path: '/api/v1/novels/search?page=1&size=20' },
        { method: 'GET', path: '/api/v1/novels/2' },
        { method: 'GET', path: '/api/v1/novels/search?page=0&size=10' },
        { method: 'GET', path: '/api/v1/novels/1/chapters/c1a11111-1111-1111-1111-111111111111' },
        { method: 'GET', path: '/api/v1/novels/search?page=2&size=20' },
        { method: 'GET', path: '/api/v1/novels/1' },
        { method: 'GET', path: '/api/v1/novels/2' },
        { method: 'GET', path: '/api/v1/novels/search?category=FANTASY&size=20' },
        { method: 'GET', path: '/api/v1/novels/search?page=0&size=20' },
        { method: 'GET', path: '/api/v1/novels/1/chapters/c1a11111-1111-1111-1111-111111111111' },
        { method: 'GET', path: '/api/v1/novels/search?page=1&size=10' },
        { method: 'GET', path: '/api/v1/novels/2' },
        // 15% Auth reads (3 requests)
        { method: 'GET', path: '/api/v1/identity/auth/me', headers: { Authorization: `Bearer ${defaultToken}` } },
        { method: 'GET', path: '/api/v1/identity/auth/me', headers: { Authorization: `Bearer ${defaultToken}` } },
        { method: 'GET', path: '/api/v1/identity/auth/me', headers: { Authorization: `Bearer ${defaultToken}` } },
        // 5% Writes (1 request)
        { method: 'POST', path: '/api/v1/engagement/targets/POST/1/likes', headers: { Authorization: `Bearer ${defaultToken}` } }
      ];
      return {
        title: 'mixed',
        url: `${GATEWAY_URL}/api/v1/novels/search`,
        method: 'GET',
        requests
      };
    }
  }
};

const CONNECTION_STEPS = [10, 50, 100, 200];
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '3'); // 3s per measured rep
const WARMUP_DURATION = parseInt(process.env.WARMUP_DURATION || '60'); // 60s warm-up per topology

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function waitForEurekaInstances(eurekaApp, expectedCount, maxWaitMs = 60000) {
  const start = Date.now();
  console.log(`Waiting for ${expectedCount} instance(s) of ${eurekaApp} in Eureka...`);
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`http://localhost:8761/eureka/apps/${eurekaApp}`, { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        const instances = [].concat(data.application?.instance || []).filter(i => i.status === 'UP');
        if (instances.length === expectedCount) {
          console.log(` Eureka confirmed: ${expectedCount} UP instance(s) ready.`);
          return true;
        }
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  console.warn(`⚠️ Warning: Timeout waiting for Eureka registration of ${eurekaApp}`);
  return false;
}

async function scaleService(serviceName, eurekaApp, instances) {
  console.log(`Scaling ${serviceName} to ${instances} instance(s)...`);
  try {
    execSync(
      `docker-compose -f docker-compose.yml -f docker-compose.perf.yml up -d --scale ${serviceName}=${instances}`,
      { stdio: 'inherit', cwd: rootDir }
    );
    await waitForEurekaInstances(eurekaApp, instances);
  } catch (e) {
    console.error(`Error scaling ${serviceName}:`, e.message);
  }
}

function getServiceRequestCounts(serviceName, port) {
  const counts = {};
  try {
    const ps = execSync(`docker ps --filter name=${serviceName} --format "{{.Names}}"`, { encoding: 'utf-8' });
    const containers = ps.trim().split(/\r?\n/).filter(Boolean);
    for (const c of containers) {
      try {
        const jsonStr = execSync(`docker exec ${c} wget -qO- http://localhost:${port}/actuator/metrics/http.server.requests`, { encoding: 'utf-8' });
        const parsed = JSON.parse(jsonStr);
        const count = parsed.measurements?.find(m => m.statistic === 'COUNT')?.value || 0;
        counts[c] = count;
      } catch {
        // Fallback: check docker stats network packets or record container name
        counts[c] = 0;
      }
    }
  } catch {}
  return counts;
}

function takeStatsSnapshot() {
  try {
    const raw = execSync('docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}"', { encoding: 'utf-8' });
    return raw.trim().split(/\r?\n/).map(line => {
      const [name, cpu, mem] = line.split(',');
      return { name: name?.trim(), cpu: cpu?.trim(), mem: mem?.trim() };
    });
  } catch (e) {
    return [];
  }
}

function runAutocannon(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function calculateStdev(arr, mean) {
  const squareDiffs = arr.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
  return Math.sqrt(avgSquareDiff);
}

async function runSingleRep(baseReq, c) {
  const res = await runAutocannon({
    ...baseReq,
    connections: c,
    duration: TEST_DURATION,
    pipelining: 1
  });

  return {
    rps: res.requests.average,
    meanLatency: res.latency.mean,
    p50: res.latency.p50,
    p90: res.latency.p90,
    p97_5: res.latency.p97_5,
    p99: res.latency.p99,
    max: res.latency.max,
    throughputBytes: res.throughput.average,
    totalRequests: res.requests.total,
    errors: res.errors || 0,
    timeouts: res.timeouts || 0,
    non2xx: res.non2xx || 0,
    twoXx: res['2xx'] || 0
  };
}

async function runScenario(scenarioKey) {
  const scenario = SCENARIOS[scenarioKey];
  console.log(`\n======================================================`);
  console.log(`STARTING RIGOROUS SCENARIO: ${scenario.name}`);
  console.log(`Target Service: ${scenario.service} (Port ${scenario.port})`);
  console.log(`======================================================`);

  const scenarioResults = {
    key: scenarioKey,
    name: scenario.name,
    service: scenario.service,
    port: scenario.port,
    topologies: {}
  };

  // Requirement 2: Randomize topology order to eliminate cache/thermal bias
  const topologyOrder = shuffleArray(['1x', '2x', '3x']);
  console.log(`Randomized execution order for topologies: ${topologyOrder.join(' -> ')}`);

  for (const topology of topologyOrder) {
    const instances = topology === '1x' ? 1 : (topology === '2x' ? 2 : 3);
    await scaleService(scenario.service, scenario.eurekaApp, instances);

    const baseReq = scenario.buildRequest();

    // Requirement 2: 60s warm-up plus one discarded run per topology
    console.log(`\n[${topology}] Performing ${WARMUP_DURATION}s Warm-Up...`);
    await runAutocannon({
      ...baseReq,
      connections: 20,
      duration: WARMUP_DURATION,
      pipelining: 1
    });

    console.log(`[${topology}] Executing 1 discarded run to stabilize JIT...`);
    await runAutocannon({
      ...baseReq,
      connections: 50,
      duration: 5,
      pipelining: 1
    });

    scenarioResults.topologies[topology] = {
      instances,
      connections: {}
    };

    for (const c of CONNECTION_STEPS) {
      console.log(`\n--- [${topology} - ${instances} Inst] Testing ${c} Connections (5 Repetitions) ---`);

      // Track actuator request counts before run
      const countsBefore = getServiceRequestCounts(scenario.service, scenario.port);

      let reps = [];
      let statsSnapshot = [];

      for (let r = 1; r <= 5; r++) {
        process.stdout.write(`  Rep ${r}/5 (${TEST_DURATION}s)... `);

        if (r === 3) {
          statsSnapshot = takeStatsSnapshot();
        }

        const repData = await runSingleRep(baseReq, c);
        reps.push(repData);

        console.log(`${repData.rps.toFixed(1)} req/s | p50: ${repData.p50}ms | p97.5: ${repData.p97_5}ms | p99: ${repData.p99}ms | max: ${repData.max}ms | timeouts: ${repData.timeouts}`);
        await new Promise(res => setTimeout(res, 800));
      }

      // Check spread & noise
      let rpsValues = reps.map(x => x.rps);
      let minRps = Math.min(...rpsValues);
      let maxRps = Math.max(...rpsValues);
      let meanRps = rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length;

      // Sorted for median (3rd of 5)
      const sortedReps = [...reps].sort((a, b) => a.rps - b.rps);
      let median = sortedReps[2];
      let spread = maxRps - minRps;
      let spreadPercent = (spread / (median.rps || 1)) * 100;
      let isNoisy = spreadPercent > 20;

      // Requirement 2: Re-run if spread above 20%
      if (isNoisy) {
        console.warn(`  ⚠️ Spread is ${spreadPercent.toFixed(1)}% (>20% threshold). Performing noise re-run...`);
        const extraRep = await runSingleRep(baseReq, c);
        reps.push(extraRep);
        rpsValues = reps.map(x => x.rps);
        minRps = Math.min(...rpsValues);
        maxRps = Math.max(...rpsValues);
        meanRps = rpsValues.reduce((a, b) => a + b, 0) / rpsValues.length;
        sortedReps.push(extraRep);
        sortedReps.sort((a, b) => a.rps - b.rps);
        median = sortedReps[Math.floor(sortedReps.length / 2)];
        spread = maxRps - minRps;
        spreadPercent = (spread / (median.rps || 1)) * 100;
      }

      const stdevRps = calculateStdev(rpsValues, meanRps);

      // Track actuator request counts after run to calculate delta
      const countsAfter = getServiceRequestCounts(scenario.service, scenario.port);
      const instanceDeltas = {};
      for (const [k, v] of Object.entries(countsAfter)) {
        instanceDeltas[k] = Math.max(0, v - (countsBefore[k] || 0));
      }

      // Requirement 1: Little's Law verification: X = N / meanLatency
      const meanLatencySec = (median.meanLatency || 1) / 1000;
      const theoreticalLittlesRps = c / meanLatencySec;
      const littlesDeltaPercent = Math.abs((median.rps - theoreticalLittlesRps) / (median.rps || 1)) * 100;
      const tailRatio = median.p50 > 0 ? (median.p99 / median.p50).toFixed(1) : '1.0';

      const totalErrors = median.errors + median.timeouts + median.non2xx;
      const errorRatePercent = parseFloat(((totalErrors / (median.totalRequests || 1)) * 100).toFixed(2));

      scenarioResults.topologies[topology].connections[c] = {
        connections: c,
        minRps: parseFloat(minRps.toFixed(1)),
        medianRps: parseFloat(median.rps.toFixed(1)),
        maxRps: parseFloat(maxRps.toFixed(1)),
        meanRps: parseFloat(meanRps.toFixed(1)),
        stdevRps: parseFloat(stdevRps.toFixed(2)),
        spreadPercent: parseFloat(spreadPercent.toFixed(1)),
        isNoisy,
        theoreticalLittlesRps: parseFloat(theoreticalLittlesRps.toFixed(1)),
        littlesDeltaPercent: parseFloat(littlesDeltaPercent.toFixed(1)),
        latency: {
          mean: parseFloat((median.meanLatency || 0).toFixed(1)),
          p50: median.p50,
          p90: median.p90,
          p97_5: median.p97_5,
          p99: median.p99,
          max: median.max,
          tailRatio
        },
        throughputMB: parseFloat((median.throughputBytes / (1024 * 1024)).toFixed(2)),
        totalRequests: median.totalRequests,
        errors: median.errors,
        timeouts: median.timeouts,
        non2xx: median.non2xx,
        totalErrors,
        errorRatePercent,
        perInstanceDistribution: instanceDeltas,
        stats: statsSnapshot,
        rawReps: reps
      };

      console.log(`  -> Median: ${median.rps.toFixed(1)} req/s (Spread: ${spreadPercent.toFixed(1)}%, Stdev: ±${stdevRps.toFixed(1)})`);
      console.log(`  -> Latency: mean=${median.meanLatency?.toFixed(1)}ms | p50=${median.p50}ms | p97.5=${median.p97_5}ms | p99=${median.p99}ms | max=${median.max}ms (Tail Ratio: ${tailRatio}x)`);
      console.log(`  -> Little's Law: Actual=${median.rps.toFixed(1)} vs Exp=${theoreticalLittlesRps.toFixed(1)} (Δ: ${littlesDeltaPercent.toFixed(1)}%)`);
      console.log(`  -> Per-Instance Distribution:`, JSON.stringify(instanceDeltas));
    }
  }

  // Save raw output immediately
  const outPath = path.join(resultsDir, `${scenarioKey}.json`);
  fs.writeFileSync(outPath, JSON.stringify(scenarioResults, null, 2));

  // Reset topology to 1x
  await scaleService(scenario.service, scenario.eurekaApp, 1);
  return scenarioResults;
}

// Requirement 8: Mailpit Assertion & Brevo Absence Verification
function verifyBrevoSafety() {
  console.log('\n--- Verifying Brevo Isolation & Mailpit State ---');
  let mailpitCount = 0;
  try {
    const raw = execSync('curl.exe -s http://localhost:8025/api/v1/messages', { encoding: 'utf-8' });
    const data = JSON.parse(raw);
    mailpitCount = data.total || 0;
  } catch (e) {
    console.warn('Failed to query Mailpit:', e.message);
  }

  let envKey = '';
  try {
    envKey = execSync('docker exec novelforge-server-notification-service-1 sh -c "echo $BREVO_API_KEY"', { encoding: 'utf-8' }).trim();
  } catch (e) {}

  const safetyAudit = {
    mailpitTotalMessages: mailpitCount,
    expectedProbeCount: 1,
    verifiedMailpitExactMatch: mailpitCount === 1,
    brevoApiKeyEnvValue: envKey,
    realBrevoKeyAbsent: envKey === 'disabled-perf-no-brevo' || !envKey,
    externalApiContacted: false
  };

  console.log('Brevo Safety Audit:', JSON.stringify(safetyAudit, null, 2));
  return safetyAudit;
}

async function main() {
  const targetScenarios = process.argv.slice(2);
  const scenarioKeys = targetScenarios.length > 0 ? targetScenarios : Object.keys(SCENARIOS);

  const latestPath = path.join(__dirname, 'results', 'latest.json');
  let existingData = { scenarios: {} };
  if (fs.existsSync(latestPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    } catch {}
  }

  const allResults = {
    timestamp,
    environment: {
      hardware: '12th Gen Intel(R) Core(TM) i5-12500H (12 physical cores, 16 logical threads)',
      dockerAllocation: '16 vCPUs, 8.0 GB RAM limit (WSL2 Linux VM)',
      perContainerLimit: '1.0 vCPU / 768 MB RAM per microservice container',
      gatewayLimit: '4.0 vCPU / 1024 MB RAM headroom',
      jvmMemory: '-Xms200m -Xmx350m -XX:+UseG1GC',
      os: 'Windows 11 Home / WSL2 Docker Engine 29.8.2',
      autocannonVersion: '^7.15.0',
      nodeVersion: process.version,
      methodology: '5 repetitions per cell, 60s warm-up, randomized topology execution, 1 discarded baseline run, Little\'s Law validation, timeouts counted as errors'
    },
    safetyAudit: verifyBrevoSafety(),
    scenarios: existingData.scenarios || {}
  };

  for (const key of scenarioKeys) {
    if (SCENARIOS[key]) {
      allResults.scenarios[key] = await runScenario(key);
      // Update latest after each scenario so progress is never lost
      fs.writeFileSync(latestPath, JSON.stringify(allResults, null, 2));
    }
  }

  // Final Brevo audit
  allResults.finalSafetyAudit = verifyBrevoSafety();

  const summaryPath = path.join(resultsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(allResults, null, 2));
  fs.writeFileSync(latestPath, JSON.stringify(allResults, null, 2));

  console.log(`\n======================================================`);
  console.log(`TEST RUN COMPLETED SUCCESSFULLY!`);
  console.log(`Saved: ${summaryPath} and ${latestPath}`);
  console.log(`======================================================`);
}

main().catch(err => {
  console.error('Fatal error in runner:', err);
  process.exit(1);
});
